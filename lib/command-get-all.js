/*! Command : Get-All */

const fs   = require('fs');
const util = require('util');

const cryptoJs = require('crypto-js');
const columnify = require('columnify');

const constants = require('./constants');


// Promisify
const fsReadFile  = util.promisify(fs.readFile);

/**
 * Get-All コマンド
 */
async function commandGetAll() {
  // DB ファイルを開く
  let rawJsonFile;
  try {
    rawJsonFile = await fsReadFile(constants.dbFilePath, 'utf-8');
  }
  catch(_error) {
    return console.error('Error: JSON ファイルが存在しないようです');
  }
  
  // JSON パースする
  let db;
  try {
    db = JSON.parse(rawJsonFile);
  }
  catch(_error) {
    return console.error('Error: JSON パースに失敗・JSON ファイルを確認してください');
  }
  
  if(Object.keys(db).length === 0) {
    return console.log('データがありません');
  }
  
  // 整形して出力する
  const formattedData = formatData(db);
  console.log(`全 ${formattedData.length - 1} 件\n`);  // 見出し区切り用のデータ分引いておく
  console.log(columnify(formattedData, {
    columnSplitter: ' | ',
    columns: ['serviceName', 'id', 'pass', 'mail', 'url', 'text'],
    config: {
      serviceName: { headingTransform: (_heading) => 'Service Name' },
      id         : { headingTransform: (_heading) => 'ID' },
      pass       : { headingTransform: (_heading) => 'Password' },
      mail       : { headingTransform: (_heading) => 'E-Mail' },
      url        : { headingTransform: (_heading) => 'URL' },
      text       : { headingTransform: (_heading) => 'Text' },
    }
  }));
}

/**
 * データを出力用に整形する
 * 
 * @param db パースしたデータ
 * @return 整形したデータ
 */
function formatData(db) {
  // 整形したデータを入れる配列・1行目は見出し区切り用のダミーデータ
  const formattedData = [{
    serviceName: '------------',
    id         : '--',
    pass       : '--------',
    mail       : '------',
    url        : '---',
    text       : '----'
  }];
  
  Object.keys(db).forEach((serviceName) => {
    db[serviceName].forEach((data) => {
      // サービス名項目を追加する
      data['serviceName'] = serviceName;
      // パスワードは復号する
      if(data['pass'] !== undefined) {
        const decryptedPass = cryptoJs.AES.decrypt(data['pass'], constants.masterPass).toString(cryptoJs.enc.Utf8);
        data['pass'] = decryptedPass.length === 0 ? '(復号に失敗)' : decryptedPass;
      }
      // 不要な項目を削除する
      delete data['createdAt'];
      delete data['updatedAt'];
      // 整形済データとして追加する
      formattedData.push(data);
    });
  });
  
  return formattedData;
}


module.exports = commandGetAll;
