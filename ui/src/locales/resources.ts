import en from './en/messages';
import da from './da/messages';
import de from './de/messages';
import el from './el/messages';
import es from './es/messages';
import fr from './fr/messages';
import it from './it/messages';
import ko from './ko/messages';
import pl from './pl/messages';
import pt_br from './pt-br/messages';
import ru from './ru/messages';
import sl from './sl/messages';
import tr from './tr/messages';
import uk from './uk/messages';
import zh_hans from './zh-hans/messages';

export const supportedLanguages = ["en","da","de","el","es","fr","it","ko","pl","pt-br","ru","sl","tr","uk","zh-hans"] as const;

const resources = {
	'en': { translation: en },
	'da': { translation: da },
	'de': { translation: de },
	'el': { translation: el },
	'es': { translation: es },
	'fr': { translation: fr },
	'it': { translation: it },
	'ko': { translation: ko },
	'pl': { translation: pl },
	'pt-br': { translation: pt_br },
	'ru': { translation: ru },
	'sl': { translation: sl },
	'tr': { translation: tr },
	'uk': { translation: uk },
	'zh-hans': { translation: zh_hans },
};

export default resources;
