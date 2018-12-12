/*! Constants */

const os   = require('os');
const path = require('path');


/** マスターキーを取得する環境変数名 */
const masterPassName = 'NEOS_MASTER_PASS';

/** マスターキー文字列 (環境変数より取得) */
const masterPass = `${process.env[masterPassName]}`;

/** DB ファイル名 */
const dbFileName = 'neos-password-manager-db.json';

/** DB ファイルのパス */
const dbFilePath = path.resolve(os.homedir(), dbFileName);


module.exports = {
  masterPassName,
  masterPass,
  dbFileName,
  dbFilePath
};
