/*! Command : Get */

const fs   = require('fs');
const util = require('util');

const cryptoJs = require('crypto-js');
const columnify = require('columnify');

const constants = require('./constants');


// Promisify
const fsReadFile  = util.promisify(fs.readFile);

/**
 * Get コマンド
 * 
 * @param query クエリ文字列
 * @param cmd オプション
 */
async function commandGet(query, cmd) {
  // オプションを整形する
  const values = createValues(query, cmd);
  
  // 引数チェック
  if(Object.keys(values).length === 0) {
    return console.error('Error: 条件を指定してください');
  }
  
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
  
  // 検索する
  const results = search(db, values);
  
  if(Object.keys(results).length === 0) {
    return console.log('対象データが見つかりませんでした');
  }
  
  // 整形して出力する
  const formattedResults = formatResults(results);
  console.log(`${formattedResults.length - 1} 件ヒットしました\n`);  // 見出し区切り用のデータ分引いておく
  console.log(columnify(formattedResults, {
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
 * オプション値を整形して返す
 * 
 * @param query クエリ文字列
 * @param cmd オプション
 * @return オプション値の連想配列
 */
function createValues(query, cmd) {
  // キー名と生の値のペアを定義する
  const rawValues = [
    { key: 'query', value: query       },
    { key: 'id'   , value: cmd['id']   },
    { key: 'pass' , value: cmd['pass'] },
    { key: 'mail' , value: cmd['mail'] },
    { key: 'url'  , value: cmd['url']  },
    { key: 'text' , value: cmd['text'] }
  ];
  
  // オプションで受け取った値のみ小文字に統一してオブジェクトに格納する
  const values = rawValues.reduce((obj, pair) => {
    if(pair.value !== undefined) {
      obj[pair.key] = pair.value.toLowerCase();
    }
    return obj;
  }, {});
  
  return values;
}

/**
 * 検索処理
 * 
 * @param db JSON パースした DB データ
 * @param values 検索条件
 * @return 合致したデータのみ格納した連想配列
 */
function search(db, values) {
  const results = {};
  
  Object.keys(db).forEach((serviceName) => {
    // サービス名がクエリに一致した場合はサービスごと取り込んで終わる
    if(values['query'] && serviceName.toLowerCase().includes(values['query'])) {
      // パスワードを復号する
      db[serviceName].forEach((data) => {
        if(data['pass'] !== undefined) {
          data['pass'] = decrypt(data['pass']);
        }
      });
      results[serviceName] = db[serviceName];
      return;
    }
    
    db[serviceName].forEach((rawData) => {
      // パスワードは復号し、値を小文字に直した検索用オブジェクトを作る
      const data = convertDataToLowerCase(rawData);
      // 合致したかどうかのフラグ
      let isMatched = false;
      
      // クエリで検索する
      if(values['query']) {
        Object.keys(data).forEach((key) => {
          // 登録日・更新日は見ない
          if(['createdAt', 'updatedAt'].includes(key)) {
            return;
          }
          // 検索クエリに部分一致したら追加対象とする
          if(data[key].includes(values['query'])) {
            isMatched = true;
          }
        });
      }
      
      // 各オプションが存在していれば部分一致するか検索する
      const isIncludes = (key) => {
        return values[key] !== undefined && data[key] !== undefined && data[key].includes(values[key]);
      };
      if(['id', 'pass', 'mail', 'url', 'text'].some(key => isIncludes(key))) {
        isMatched = true;
      }
      
      // 合致した場合は検索結果に追加する
      if(isMatched) {
        if(results[serviceName]) {
          results[serviceName].push(rawData);
        }
        else {
          results[serviceName] = [rawData];
        }
      }
    });
  });
  
  return results;
}

/**
 * パスワードは復号し、各プロパティを小文字に変換して返す
 * 
 * @param rawData 元データ : パスワードの項目は復号して代入する
 * @return 各プロパティの値が小文字に変換されたデータ
 */
function convertDataToLowerCase(rawData) {
  const data = {};
  Object.keys(rawData).forEach((key) => {
    // パスワードがあれば復号し元データに再設定する (検索結果表示に使用するため) : 復号に失敗した場合は空文字になる
    if(key === 'pass') {
      rawData[key] = decrypt(rawData[key]);
    }
    data[key] = rawData[key].toLowerCase();
  });
  return data;
}

/**
 * 文字列を復号する
 * 
 * @param value 復号したい文字列
 * @return 復号した文字列
 */
function decrypt(value) {
  return cryptoJs.AES.decrypt(value, constants.masterPass).toString(cryptoJs.enc.Utf8);
}

/**
 * 検索結果を出力用に整形する
 * 
 * @param results 検索結果
 * @return 整形した検索結果
 */
function formatResults(results) {
  // 整形したデータを入れる配列・1行目は見出し区切り用のダミーデータ
  const formattedResults = [{
    serviceName: '------------',
    id  : '--',
    pass: '--------',
    mail: '------',
    url : '---',
    text: '----'
  }];
  
  Object.keys(results).forEach((serviceName) => {
    results[serviceName].forEach((data) => {
      // サービス名項目を追加する
      data['serviceName'] = serviceName;
      // パスワードがあれば復号できているか確認する
      if(data['pass'] !== undefined && data['pass'].length === 0) {
        data['pass'] = '(復号に失敗)';
      }
      // 不要な項目を削除する
      delete data['createdAt'];
      delete data['updatedAt'];
      // 整形済データとして追加する
      formattedResults.push(data);
    });
  });
  
  return formattedResults;
}


module.exports = commandGet;
