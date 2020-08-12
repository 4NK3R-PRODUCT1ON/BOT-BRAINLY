//define package
const fs = require('fs');
const { Client } = require('whatsapp-web.js');
const { MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const brainly = require('brainly-scraper');
const cheerio = require('cheerio');
const request = require('request');
const colors = require('colors');
const cron = require('node-cron');
const Virdina = require('./lib/Virdina');


colors.setTheme({
  title: 'black',
  foto: 'bgGreen',
  warn: 'bgYellow',
  error:'red'
});


// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';

//Load the session data if it has been previously saved
let sessionData;
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

//Use the saved values
const client = new Client({
    session: sessionData
});


//Save session values to the file upon successful auth
client.on('authenticated', (session) => {
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

//qrcode
client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    qrcode.generate(qr, {small: true});
});

//appear when bot is ready
client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
	console.log(`RECEIVED MESSAGE! ${message.from} : ${message.body}`)
	Virdina.set(message);
	Virdina.addPrefix('/');

	Virdina.createCommand('brainly ',function(msg,res){
    //  /brainly <pertanyaan> n:<jumlah>
    let raw=res.split(/\s/)
    let amount = Number(raw[raw.length-1].split('-')[1]) || 5
    if(Number(raw[raw.length-1])){
      raw.pop()
    }
		let question = raw.join(" ") 

    Virdina.replyMessage(`*Pertanyaan : ${question}*\n*Jumlah Jawaban : ${Number(amount)}*`)
    
    BrainlySearch(question,Number(amount),function(res){
      console.log(res)
      res.forEach(x=>{
          Virdina.replyMessage(`*foto pertanyaan*\n${x.fotoPertanyaan.join('\n')}\n*pertanyaan :*\n${x.pertanyaan}\n\n*jawaban :*\n${x.jawaban.judulJawaban}\n*foto jawaban*\n${x.jawaban.fotoJawaban.join('\n')}`)
      })
    })
	})

  Virdina.createCommand("img ",function(msg,res){

    Virdina.replyMessage('*Downloading img....*')
    let getExtention = /[^.]+$/.exec(res.trim());
    Virdina.downloadImage(res.trim(),`image/img1.${getExtention}`,()=>{
      console.log('download success')
      var imgBase64=fs.readFileSync(`image/img1.${getExtention}`,'base64')
      const media = new MessageMedia(`image/img1.${getExtention}`,imgBase64)
      client.sendMessage(message.from, media, { caption : ' here'})
    })

  })

  Virdina.createCommand('help',function(msg,res){
    pesan=``
    pesan+=`*Bot Virdina-Brainly 🤖 👩‍💻*\n*Menu*\n\n💡Brainly Search\n/brainly <pertanyaan> -<jumlah>\n*/brainly rumus mtk -10*`
    pesan+=`\n\n💡Download Image\n/img <link>\n*/img https://www.google.co.id/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png* belakangnya harus ber ekstensi (.jpg,.png,dll)`
    pesan+="\n\n*Created by diosamuel*"
    Virdina.replyMessage(pesan)
  })

})

client.initialize();

cron.schedule('2 * * * * *', () => {
    Virdina.resetFolder("image")
});

function BrainlySearch(pertanyaan, amount,cb){
    brainly(pertanyaan.toString(),Number(amount)).then(res => {
      
      let brainlyResult=[];
    
        res.forEach(ask=>{
          let opt={
            pertanyaan:ask.pertanyaan,
            fotoPertanyaan:ask.questionMedia,
          }
          ask.jawaban.forEach(answer=>{
            opt.jawaban={
              judulJawaban:answer.text,
              fotoJawaban:answer.media
            }
          })
            brainlyResult.push(opt) 
        })
    
        return brainlyResult
    
    }).then(x=>{
        
        cb(x)

    }).catch(err=>{
        
        console.log(`${err}`.error)
    
    })
}
