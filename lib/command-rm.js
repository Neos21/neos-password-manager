/*! Command : Rm */

const fs   = require('fs');
const util = require('util');

const constants = require('./constants');


// Promisify
const fsReadFile  = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);

/**
 * Rm コマンド
 * 
 * @param serviceName サービス名
 * @param cmd オプション
 */
async function commandRm(serviceName, cmd) {
  // オプションを整形する
  const values = createValues(cmd);
  
  // 引数チェック
  if(Object.keys(values).length === 0) {
    return console.error('Error: ID か E-mail を条件に指定してください');
  }
  
  // DB ファイルを開く
  let beforeJsonFile;
  try {
    beforeJsonFile = await fsReadFile(constants.dbFilePath, 'utf-8');
  }
  catch(_error) {
    return console.error('Error: JSON ファイルが存在しないようです');
  }
  
  // JSON パースする
  let db;
  try {
    db = JSON.parse(beforeJsonFile);
  }
  catch(_error) {
    return console.error('Error: JSON パースに失敗・JSON ファイルを確認してください');
  }
  
  // 対象を検索して削除する
  const removed = removeData(db, serviceName, values);
  db = removed.db;
  
  if(removed.count === 0) {
    return console.log('対象データが見つかりませんでした');
  }
  
  // 変換してファイルに書き込む
  try {
    const afterJsonFile = `${JSON.stringify(db, null, '  ')}\n`;
    await fsWriteFile(constants.dbFilePath, afterJsonFile, 'utf-8');
    console.log(`${removed.count} 件削除しました`);
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
    { key: 'id'   , value: cmd['id']   },
    { key: 'mail' , value: cmd['mail'] }
  ];
  
  // オプションで受け取った値のみオブジェクトに格納する
  const values = rawValues.reduce((obj, pair) => {
    if(pair.value !== undefined) {
      obj[pair.key] = pair.value;
    }
    return obj;
  }, {});
  
  return values;
}

/**
 * サービス名、ID、E-mail に完全一致するデータを削除する
 * 
 * @param db パースしたデータ
 * @param serviceName サービス名
 * @param values 削除条件となるデータ
 * @return データ削除後の第1引数 db と、削除件数をまとめた連想配列
 */
function removeData(db, serviceName, values) {
  let count = 0;
  
  // 指定のサービス名のデータがなければその時点で終了する
  if(db[serviceName] === undefined) {
    return { db, count };
  }
  
  let removeIndex = -1;
  db[serviceName].forEach((data, index) => {
    // values の項目ごとに data の内容と一致するか確認する
    // ID・E-mail を同時指定した場合は両方が合致しないと削除しない
    if(Object.keys(values).every((key) => {
      return data[key] !== undefined && data[key] === values[key];
    })) {
      removeIndex = index;  // 削除対象の添字を控える
    }
  });
  
  // 削除対象があれば削除する
  if(removeIndex > -1) {
    const removedData = db[serviceName].splice(removeIndex, 1);  // 1件削除
    count += removedData.length;  // 必ず1件
  }
  
  // 削除した結果、対象のサービスにデータがなくなっていたらそのサービスごと削除する
  if(db[serviceName].length === 0) {
    delete db[serviceName];
  }
  
  return { db, count };
}


module.exports = commandRm;
