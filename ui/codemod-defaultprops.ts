/**
 * Codemod: migrate React defaultProps to ES6 default parameters for React 19.
 *
 * Handles:
 *  A) Existing body destructuring `const { a, b } = props;` → add defaults + replace props.a → a
 *  B) Plain `props` access → insert `const { a = va, b = vb } = props;` at body top
 *     - Detects naming conflicts (prop name = local var) → uses `a: _a = va` alias
 *     - Replaces `props.a` → `a` (or `_a` if aliased) throughout body
 *
 * Run with: ts-node --skipProject codemod-defaultprops.ts
 */

import {
	Project,
	SyntaxKind,
	Node,
	ObjectBindingPattern,
	VariableStatement,
	Block,
	PropertyAccessExpression,
} from 'ts-morph';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const project = new Project({
	tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
	skipAddingFilesFromTsConfig: true,
});

const srcDir = path.join(__dirname, 'src');
project.addSourceFilesAtPaths([`${srcDir}/**/*.tsx`, `${srcDir}/**/*.ts`]);

let totalFiles = 0;
let modifiedFiles = 0;
let skippedComponents = 0;

for (const sourceFile of project.getSourceFiles()) {
	const filePath = sourceFile.getFilePath();

	// Collect all `Name.defaultProps = { ... }` expression statements
	const allStatements = sourceFile.getDescendantsOfKind(
		SyntaxKind.ExpressionStatement,
	);
	const todo: Array<{
		statement: (typeof allStatements)[0];
		componentName: string;
		defaults: Map<string, string>;
	}> = [];

	for (const stmt of allStatements) {
		const expr = stmt.getExpression();
		if (!Node.isBinaryExpression(expr)) continue;
		if (expr.getOperatorToken().getText() !== '=') continue;
		const left = expr.getLeft();
		if (!Node.isPropertyAccessExpression(left)) continue;
		if (left.getName() !== 'defaultProps') continue;
		const componentName = left.getExpression().getText();
		const right = expr.getRight();
		if (!Node.isObjectLiteralExpression(right)) continue;

		const defaults = new Map<string, string>();
		for (const prop of right.getProperties()) {
			if (Node.isPropertyAssignment(prop)) {
				defaults.set(
					prop.getName(),
					prop.getInitializer()?.getText() ?? 'undefined',
				);
			} else if (Node.isShorthandPropertyAssignment(prop)) {
				defaults.set(prop.getName(), prop.getName());
			}
		}
		todo.push({ statement: stmt, componentName, defaults });
	}

	if (todo.length === 0) continue;
	totalFiles++;
	let fileModified = false;

	for (const { statement, componentName, defaults } of todo) {
		// Locate the function body and first parameter
		let funcBody: Block | undefined;
		let paramName = 'props';

		// 1. Named function declaration
		const funcDecl = sourceFile.getFunction(componentName);
		if (funcDecl) {
			const body = funcDecl.getBody();
			if (body && Node.isBlock(body)) {
				funcBody = body;
				const p0 = funcDecl.getParameters()[0];
				paramName = p0?.getNameNode()?.getText() ?? 'props';
				// If the param is already destructured (ObjectBindingPattern), handle Case B inline
				if (p0 && Node.isObjectBindingPattern(p0.getNameNode())) {
					addDefaultsToBindingPattern(
						p0.getNameNode() as ObjectBindingPattern,
						defaults,
					);
					statement.remove();
					fileModified = true;
					continue;
				}
			}
		}

		// 2. Variable declaration (arrow function, function expr, forwardRef wrapper)
		if (!funcBody) {
			const varDecl = sourceFile.getVariableDeclaration(componentName);
			const init = varDecl?.getInitializer();
			if (init) {
				const inner =
					Node.isArrowFunction(init) ||
					Node.isFunctionExpression(init)
						? init
						: init
									.asKind(SyntaxKind.CallExpression)
									?.getArguments()[0]?.asKindOrThrow ===
							  undefined
							? (init
									.asKind(SyntaxKind.CallExpression)
									?.getArguments()[0] as
									| ReturnType<typeof init.asKind>
									| undefined)
							: undefined;

				// Safely pull the first arg of a callExpression (forwardRef case)
				const callExpr = init.asKind(SyntaxKind.CallExpression);
				const firstArg = callExpr?.getArguments()[0];
				const fn =
					Node.isArrowFunction(init) ||
					Node.isFunctionExpression(init)
						? init
						: firstArg &&
							  (Node.isArrowFunction(firstArg) ||
									Node.isFunctionExpression(firstArg))
							? firstArg
							: undefined;

				if (fn) {
					const body = fn.getBody();
					if (body && Node.isBlock(body)) {
						funcBody = body;
						const p0 = fn.getParameters()[0];
						paramName = p0?.getNameNode()?.getText() ?? 'props';
						if (
							p0 &&
							Node.isObjectBindingPattern(p0.getNameNode())
						) {
							addDefaultsToBindingPattern(
								p0.getNameNode() as ObjectBindingPattern,
								defaults,
							);
							statement.remove();
							fileModified = true;
							continue;
						}
					}
				}
			}
		}

		if (!funcBody) {
			console.warn(
				`  SKIP: no block body for ${componentName} in ${path.relative(srcDir, filePath)}`,
			);
			skippedComponents++;
			continue;
		}

		// Look for an existing `const { ... } = <paramName>;` in the body statements
		let existingPattern: ObjectBindingPattern | undefined;
		let existingStatement: VariableStatement | undefined;

		for (const s of funcBody.getStatements()) {
			if (!Node.isVariableStatement(s)) continue;
			const decl = s.getDeclarationList().getDeclarations()[0];
			if (!decl) continue;
			const nameNode = decl.getNameNode();
			if (!Node.isObjectBindingPattern(nameNode)) continue;
			const initText = decl.getInitializer()?.getText().trim();
			if (initText !== paramName) continue;
			existingPattern = nameNode;
			existingStatement = s;
			break;
		}

		if (existingPattern) {
			// Case A: existing body destructuring — add defaults + replace props.key
			const keyToVar = addDefaultsToBindingPattern(
				existingPattern,
				defaults,
			);
			replacePropsDotKey(funcBody, keyToVar, paramName);
		} else {
			// Case C: plain props access — detect conflicts, insert destructuring, replace
			const localVars = getLocalVarNames(funcBody);
			const keyToVar = new Map<string, string>();

			const parts: string[] = [];
			for (const [k, v] of defaults) {
				if (localVars.has(k)) {
					const alias = `_${k}`;
					parts.push(`${k}: ${alias} = ${v}`);
					keyToVar.set(k, alias);
				} else {
					parts.push(`${k} = ${v}`);
					keyToVar.set(k, k);
				}
			}
			funcBody.insertStatements(
				0,
				`const { ${parts.join(', ')} } = ${paramName};`,
			);
			replacePropsDotKey(funcBody, keyToVar, paramName);
		}

		statement.remove();
		fileModified = true;
	}

	if (fileModified) {
		sourceFile.saveSync();
		modifiedFiles++;
		console.log(`Modified: ${path.relative(srcDir, filePath)}`);
	}
}

console.log(
	`\nDone: ${modifiedFiles}/${totalFiles} files modified, ${skippedComponents} skipped`,
);

// ─── helpers ────────────────────────────────────────────────────────────────

/** Add defaults to an ObjectBindingPattern. Returns propName → localVarName map. */
function addDefaultsToBindingPattern(
	pattern: ObjectBindingPattern,
	defaults: Map<string, string>,
): Map<string, string> {
	const keyToVar = new Map<string, string>();
	const elements = pattern.getElements();

	// Set initializers on existing elements
	for (const el of elements) {
		if (el.getDotDotDotToken()) continue;
		const propName = el.getPropertyNameNode()?.getText() ?? el.getName();
		const localName = el.getName();
		if (defaults.has(propName) && !el.getInitializer()) {
			el.setInitializer(defaults.get(propName)!);
		}
		if (defaults.has(propName)) {
			keyToVar.set(propName, localName);
		}
	}

	// Add any defaultProps keys not already in the pattern (before rest element)
	const existingNames = new Set(
		elements.map(
			(el) => el.getPropertyNameNode()?.getText() ?? el.getName(),
		),
	);
	const toAdd = [...defaults.entries()].filter(
		([k]) => !existingNames.has(k),
	);

	if (toAdd.length > 0) {
		const restEl = elements.find((el) => el.getDotDotDotToken());
		const normalEls = elements.filter((el) => !el.getDotDotDotToken());
		const newParts = toAdd.map(([k, v]) => `${k} = ${v}`);
		const allParts = [
			...normalEls.map((el) => el.getText()),
			...newParts,
			...(restEl ? [restEl.getText()] : []),
		];
		pattern.replaceWithText(`{ ${allParts.join(', ')} }`);
		for (const [k] of toAdd) {
			keyToVar.set(k, k);
		}
	}

	return keyToVar;
}

/** Collect top-level local variable names declared in a block (first level only). */
function getLocalVarNames(body: Block): Set<string> {
	const names = new Set<string>();
	for (const stmt of body.getStatements()) {
		if (!Node.isVariableStatement(stmt)) continue;
		for (const decl of stmt.getDeclarationList().getDeclarations()) {
			const nameNode = decl.getNameNode();
			if (Node.isIdentifier(nameNode)) {
				names.add(nameNode.getText());
			} else if (Node.isObjectBindingPattern(nameNode)) {
				for (const el of nameNode.getElements()) {
					if (!el.getDotDotDotToken()) names.add(el.getName());
				}
			}
		}
	}
	return names;
}

/** Replace `paramName.key` with the mapped local var name throughout the body. */
function replacePropsDotKey(
	body: Block,
	keyToVar: Map<string, string>,
	paramName: string,
): void {
	const accessors = body.getDescendantsOfKind(
		SyntaxKind.PropertyAccessExpression,
	);
	const toReplace: Array<{
		node: PropertyAccessExpression;
		newText: string;
	}> = [];

	for (const accessor of accessors) {
		if (accessor.getExpression().getText() !== paramName) continue;
		const prop = accessor.getName();
		if (!keyToVar.has(prop)) continue;
		toReplace.push({ node: accessor, newText: keyToVar.get(prop)! });
	}

	// Replace in reverse order to preserve text positions
	for (const { node, newText } of toReplace.reverse()) {
		node.replaceWithText(newText);
	}
}
