'use strict';

var http = require('http');
var restify = require('restify'); // ローカル開発用のフレームワーク
var builder = require('botbuilder'); // Bot Builder SDK
var server = restify.createServer();
var geocoder = require('geocoder');

//process.on('unhandledRejection', console.dir);
server.listen(3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
//var connector = new builder.ChatConnector();
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// API_KEYは注意ね！
var API_KEY = process.env.WEATHER_API_KEI;
var URL = 'http://api.openweathermap.org/data/2.5/weather?q=Tokyo,JP&units=metric&appid=' + API_KEY;

// 天気を取得します。
function getWeather () {
    return new Promise((resolve, reject) => {
        http.get(URL, (res) => {
            let rawData = '';
            res.on('data', chunk => {
                rawData += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(rawData));
            });
        }).on('error', err => {
            reject(err.message);
        });
    });
}

// ユーザーからの全てのメッセージに反応する、ルートダイアログです。
bot.dialog('/', [
    session => {
        // 下部にあるaskダイアログに会話の制御を渡します。
        session.beginDialog('/ask');
    },
    // askダイアログが閉じられると、制御がルートダイアログに戻り下記が実行されます。
    (session, results) => {
        var response = results.response.entity;
        getWeather().then(
            data => {
                if (response === '気温') {
                    //console.log(data)
                    session.send(data.name + 'の ' + '気温は%s°です！', Math.round(data.main.temp));
                } else if (response === '気圧') {
                    session.send(data.name + 'の ' + '気圧は%shpaです！', data.main.pressure);
                } else if (response === '湿度') {
                    session.send(data.name + 'の ' + '湿度は%s％です！', data.main.humidity);
                }
            },
            err => {
                session.send('天気を取得できませんでした！！');
            }
        );
    }
]);

// askダイアログ
bot.dialog('/ask', [
    session => {
        builder.Prompts.choice(session, "こんにちは！何が知りたいですか?", "気温|気圧|湿度");
    },
    (session, results) => {
        // askダイアログを閉じ、ルートダイアログにユーザーからの返答データを渡します。
        session.endDialogWithResult(results);
    }
]);