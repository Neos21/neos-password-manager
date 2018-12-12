/*! Command : Add */

const fs   = require('fs');
const util = require('util');

const cryptoJs = require('crypto-js');

const constants = require('./constants');


// Promisify
const fsReadFile  = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);

/**
 * Add コマンド
 * 
 * @param serviceName サービス名
 * @param cmd オプション
 */
async function commandAdd(serviceName, cmd) {
  // 引数チェック
  if(cmd['id'] === undefined) {
    return console.error('Error: ID は必須です');
  }
  
  // オプションを整形する
  const values = createValues(cmd);
  
  // DB ファイルを開く : ファイルがない場合は新規作成させるため空文字にしておく
  const beforeJsonFile = await fsReadFile(constants.dbFilePath, 'utf-8').catch((_error) => '');
  
  // JSON パースする : 空ファイルの場合は新規オブジェクトにする
  let db = {};
  try {
    if(beforeJsonFile.length >= 2) {  // 最低2文字 '{}' ないと JSON パースできないので文字数をチェックする
      db = JSON.parse(beforeJsonFile);
    }
  }
  catch(error) {
    return console.error('Error: JSON パースに失敗・JSON ファイルを確認してください');  // データ消失を防ぐため作業中断
  }
  
  // 既存データに合わせてデータを追加する
  db = addData(db, serviceName, values);
  
  // 変換してファイルに書き込む
  try {
    const afterJsonFile = `${JSON.stringify(db, null, '  ')}\n`;
    await fsWriteFile(constants.dbFilePath, afterJsonFile, 'utf-8');
    console.log('保存しました');
  }
  catch(_error) {
    console.error('Error: ファイル書き込みに失敗・JSON ファイルを確認してください');
  }
}

/**
 * オプション値を整形して返す
 * 
 * @param cmd オプション
 * @return オプション値の連想配列
 */
function createValues(cmd) {
  // キー名と生の値のペアを定義する
  const rawValues = [
    { key: 'id'  , value: cmd['id']   },
    { key: 'pass', value: cmd['pass'] },
    { key: 'mail', value: cmd['mail'] },
    { key: 'url' , value: cmd['url']  },
    { key: 'text', value: cmd['text'] }
  ];
  
  // オプションで受け取った値のみオブジェクトに格納する
  const values = rawValues.reduce((obj, pair) => {
    if(pair.value !== undefined) {
      obj[pair.key] = pair.value;
    }
    return obj;
  }, {});
  
  // パスワードがあれば暗号化する
  if(values['pass'] !== undefined) {
    values['pass'] = cryptoJs.AES.encrypt(values['pass'], constants.masterPass).toString();
  }
  
  return values;
}

/**
 * データを追加 or 更新する
 * 
 * @param db JSON パースした元データ・コレに追記して返す
 * @param serviceName 追加 or 更新したいサービス名
 * @param values 追加 or 更新したいデータ
 * @return 追記した第1引数 db を返す
 */
function addData(db, serviceName, values) {
  const currentDateTime = new Date().toISOString();
  
  // 当該サービスがなければ新規追加して終了する
  if(db[serviceName] === undefined) {
    values['createdAt'] = values['updatedAt'] = currentDateTime;
    db[serviceName] = [values];
    return db;
  }
  
  // 同サービスに ID か E-mail が一致するデータがあるか探す
  const sameDataIndex = db[serviceName].findIndex((data) => {
    return (values['id']   !== undefined && data['id']   === values['id'])
        || (values['mail'] !== undefined && data['mail'] === values['mail']);
  });
  
  if(sameDataIndex >= 0) {
    // 同サービスに同じ ID か E-mail のデータが既にある場合はマージ更新する
    values['updatedAt'] = currentDateTime;
    db[serviceName][sameDataIndex] = Object.assign(db[serviceName][sameDataIndex], values);
  }
  else {
    // 同サービスに同じ ID か E-mail のデータがなかった場合は別アカウントのデータとして追加する
    values['createdAt'] = values['updatedAt'] = currentDateTime;
    db[serviceName].push(values);
  }
  
  return db;
}


module.exports = commandAdd;
