require("express")().listen(1343);
const express = require("express");
const app = express();
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser')
const moment = require('moment');
moment.locale("tr");
require('dotenv/config');
const firebase = require('firebase/app');
const FieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const servis = require('./servis.json');
const randomstring = require("randomstring");
const urls = require('is-url');
const db = require("quick.db");
const discord = require("discord.js");
const client = new discord.Client({ disableEveryone: true });
client.login(process.env.TOKEN);
const fetch = require("node-fetch");
const fs = require("fs");
const helmet = require("helmet");

const md = require("marked");

app.use(express.static("public"));

const request = require("request");
const url = require("url");
const passport = require("passport");
const session = require("express-session");
const LevelStore = require("level-session-store")(session);
const Strategy = require("passport-discord").Strategy;
  app.use(
    "/css",
    express.static(path.resolve(__dirname + `/css`))
  );
  const templateDir = path.resolve(__dirname + `/src/pages/`); 

app.locals.domain = process.env.PROJECT_DOMAIN;

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

setInterval(() => {
  var links = db.get("linkler");
  if (!links) return;
  var linkA = links.map(c => c.url);
  linkA.forEach(link => {
    try {
      fetch(link);
    } catch (e) {
     // console.log("" + e);
    }
  });
  let zaman = new Date();
  console.log("Pong! Requests sent");
}, 60000);

client.on("ready", () => {
  if (!Array.isArray(db.get("linkler"))) {
    db.set("linkler", []);
  }
});


client.on("ready", () => {
  client.user.setActivity(`Link Kısaltma Uptime Servisi https://www.codsup.ml`);
  passport.use(
    new Strategy(
      {
        clientID: "788699442861572127",
        clientSecret: "mfAKk-FwyP0nFdAKEbmz00CV5Yh9DkeE",
        callbackURL: "https://www.codsup.tk/callback",
        scope: ["identify"]
      },
      (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => done(null, profile));
      }
    )
  );

  app.use(
    session({
      secret: "123",
      resave: false,
      saveUninitialized: false
    })
  );

  admin.initializeApp({
  credential: admin.credential.cert(servis)
});
let data = admin.firestore();





app.get('/kisalt', function(req, res) {
  data.collection("link").get().then(function(querySnapshot) {
    res.render('linq.ejs', {
      sayi: querySnapshot.size
    })
  })
});





app.post('/yonlendirme', async(req, res) => {
  let body = req.body;
  const ips = req.clientIp;
  if (!urls(body.link)) return res.send('Link gir')
  let random = randomstring.generate({
    length: 5,
    charset: 'alphanumeric'
  })
  if(body.link.includes('furtsy')) return res.redirect('https://www.youtube.com/watch?v=oHg5SJYRHA0')
  const linqs = data.collection('link');
const sikis = await linqs.get();
sikis.forEach(doc => {
var linkA = doc.data().link
if(linkA.includes(body.link)) return res.redirect('/linkvar')
})
  data.collection('link').doc(`${random}`).set({
    'kod': random,
    'link': body.link,
    'zaman': moment(Date.now()).add(3, 'hours').format('LLLL'),
})
    res.render('links.ejs', {
      link: `https://www.codsup.tk/link/${random}`
    })
});


app.get('/link/:string', function(req, res) {
  const linqs = req.params.string
  data.collection('link').doc(linqs).get().then((am) => {
    if (!am.exists) return res.send('Link Geçersiz...')
    res.redirect(am.data().link)
  })
});

  
  
  app.use(passport.initialize());
  app.use(passport.session());
  let linkss;
  app.use(helmet());
  let links = db.get("linkler");
  let sahipp;
  var linkA = links.map(c => c.url);
  var sahip = links.map(c => c.owner);
      try {
linkss = linkA
 sahipp = sahip
    } catch (e) {
      console.log("" + e);
    }
  
  const renderTemplate = (res, req, template, data = {}) => {
    const baseData = {
      bot: client,
      path: req.path,
      db: db,
      user: req.isAuthenticated() ? req.user : null,
      saat: `${moment().locale('tr').format('LLL')}`,
      linkss: linkss,
      sahipp: sahipp
    };
    res.render(
      path.resolve(`${templateDir}${path.sep}${template}`),
      Object.assign(baseData, data)
    );
  };
  app.get(
    "/login",
    (req, res, next) => {
      if (req.session.backURL) {
        req.session.backURL = req.session.backURL;
      } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === app.locals.domain) {
          req.session.backURL = parsed.path;
        }
      } else {
        req.session.backURL = "/";
      }
      next();
    },
    passport.authenticate("discord")
  );

  app.get("/logout", function(req, res) {
    req.session.destroy(() => {
      req.logout();
      res.redirect("/");
    });
  });

  function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.session.backURL = req.url;
    res.redirect("/login");
  }

  app.get("/autherror", (req, res) => {
    res.send(
      "Auth Error!"
    );
  });

  app.get(
    "/callback",
    passport.authenticate("discord", { failureRedirect: "/autherror" }),
    async (req, res) => {
      if (req.session.backURL) {
        const url = req.session.backURL;
        req.session.backURL = null;
        res.redirect(url);
      } else {
        res.redirect("/uptime");
      }
    }
  );
  app.get("/uptime", (req, res) => {
    renderTemplate(res, req, "index.ejs");
  });
  app.get("/add", checkAuth, (req, res) => {
    renderTemplate(res, req, "add.ejs");
  });
  app.get("/profile", (req, res) => {
    renderTemplate(res, req, "profile.ejs");
  });
  
    app.get("/izinhesap", (req, res) => {
    renderTemplate(res, req, "permission.ejs");
  });
  
      app.get("/yakinda", (req, res) => {
    renderTemplate(res, req, "yakında.ejs");
  });
  
        app.get("/tf", (req, res) => {
    renderTemplate(res, req, "tf.ejs");
  });
  
    app.get("/onaysiz", (req, res) => {
    renderTemplate(res, req, "onaysız.ejs");
  });
  
    app.get("/", (req, res) => {
    renderTemplate(res, req, "admin.ejs");
  });
   
      app.get("/pusatdavet", (req, res) => {
    renderTemplate(res, req, "pusat.ejs");
  });
  
        app.get("/linkvar", (req, res) => {
    renderTemplate(res, req, "varztn.ejs");
  });
  
            app.get("/emre", (req, res) => {
    renderTemplate(res, req, "sexipanel.ejs");
  });
  
              app.get("/tataa", (req, res) => {
    renderTemplate(res, req, "deneme.ejs");
  });
  
          app.get("/oyunapi", (req, res) => {
    renderTemplate(res, req, "oyunapi.ejs");
  });
  
  app.post("/add", checkAuth, (req, res) => {
    let ayar = req.body;
  let link = ayar["link"];
    if (!ayar["link"]) return res.send("You didn't fill out the link!");

 if(db.get("linkler").map(z => z.url).includes(link)) {
      return res.send("Link Sistemde Bulunuyor!");
    } else {
      db.push("linkler", { url: link, owner: req.user.id });
      res.send("Added " + req.user.id);
    }
  });

  const listener = app.listen(process.env.PORT, () => {
    console.log("Port:" + listener.address().port);
  });
  console.log(`Logined!`);
});


const Discord = require("discord.js");

const log = message => {
  console.log(`${message}`);
};

