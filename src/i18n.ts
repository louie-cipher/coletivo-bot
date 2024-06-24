import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'path';
import { consoleError } from 'utils/log';

const loadPath = join(__dirname, '../locales/{{lng}}/{{ns}}.json');

i18next.use(Backend).init(
	{
		lng: 'pt',
		fallbackLng: 'pt',
		ns: ['commands', 'events', 'ticket'],
		defaultNS: 'commands',
		backend: { loadPath },
	},
	(err) => {
		if (err) consoleError('ERROR', err);
	},
);

export default i18next;
