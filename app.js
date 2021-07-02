const express = require('express');
var request = require('request');
const cheerio = require('cheerio');
const util = require("util")
const app = express();
/* 引入cors */
const cors = require('cors');
app.use(cors());
/* 引入body-parser */
const bodyParser = require('body-parser');
const { get } = require('http');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all('*', function (req, res, next) {
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});


let cookie = ""

app.get('/', (req, res) => {
  res.send('<p style="color:red">服务已启动</p>');
})

// 获取用户登录信息
app.get('/api/userinfo', (req, res) => {
    cookie = req.query.cookie
    request({
        url: 'http://api.bilibili.com/x/web-interface/nav',
        method:'GET',
        headers: {
            Cookie: req.query.cookie
        }
    },function (error,response, body) {
        res.json(JSON.parse(body))
    })
})

// 获取用户关注直播间信息
app.get('/api/list', (req, res) => {
    cookie = req.query.cookie
    request({
        url: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=10',
        method:'GET',
        headers: {
            Cookie: req.query.cookie,
            referer: 'http://www.bilibili.com/'
        }
    },function (error,response, body) {
        console.log(JSON.parse(response.body).data)
        res.send(JSON.parse(response.body).data)
    })
})

// 获取bilibili具体直播间直播流
app.get('/api/liveurl', (req, res) => {
    console.log(req.query.id)
    request({
        url: 'http://api.live.bilibili.com/room/v1/Room/playUrl',
        method:'GET',
        qs: {
            cid: req.query.id
        }
    },function (error,response, body) {
        res.json(JSON.parse(body))
    })
})

// 获取bilibili搜索结果
app.get('/api/searchresults', (req, res) => {
    request({
        url: 'http://api.bilibili.com/x/web-interface/search/all/v2',
        method:'GET',
        qs: {
            keyword: req.query.keyword,
            page: req.query.page
        }
    },function (error,response, body) {
        res.send(body)
    })
})

// 获取最新季度番剧信息
app.get('/api/season', (req, res) => {
    request({
        url: 'https://api.bilibili.com/pgc/web/timeline/v2?season_type=1',
        method:'GET'
    },function (error,response, body) {
        res.json(JSON.parse(body))
    })
})

// 获取点击番剧具体信息
app.get('/api/seasoninfo', (req, res) => {
    request({
        url: 'https://www.bilibili.com/bangumi/play/ss' + req.query.season_id + '/',
        method:'GET',
        gzip: true,
        headers: {
            'Content-Type': 'text/palin; charset=utf-8'
        }
    },function (error,response, body) {
        const $ = cheerio.load(body)
        let content = util.inspect($("script").contents())
        let myRe = /"epStatus(.*?)"titleFormat":"第/g
        let results = content.match(myRe)
        let arr = []
        for (let index = 0; index < results.length; index++) {
            let element = "{" + results[index].slice(0,-17) + "}"
            arr.push(JSON.parse(element))
        }
        res.send(arr)
    })
})
    
// 获取点进番剧  集数的播放流
app.get('/api/clickvideo', (req, res) => {
    cookie = req.query.cookie
    request({
        url: 'http://api.bilibili.com/x/player/playurl',
        method:'GET',
        headers: {
            cookie: req.query.cookie
        },
        qs: {
            bvid: req.query.nowbv,
            cid: req.query.nowcid
        }
    },function (error,response, body) {
        res.json(JSON.parse(body))
    })
})

// 获取搜索视频的cid
app.get('/api/searchvideo', (req, res) => {
    console.log(req.query.cookie,req.query.avid)
    request({
        url: 'http://www.bilibili.com/video/av' + req.query.avid,
        method:'GET',
        gzip: true,
        headers: {
            cookie: req.query.cookie
        }
    },function (error,response, body) {
        let cidRe = /"cid":(\d+?),"dimension"/ 
        let cid = body.match(cidRe)[0].slice(6,15)
        res.send(cid)
    })
})

// 获取视频播放流
app.get('/api/videoplay', (req, res) => {
    request({
        url: 'http://api.bilibili.com/x/player/playurl?avid=' + req.query.avid + '&cid=' + req.query.cid,
        method:'GET',
        headers: {
            cookie
        }
    },function (error,response, body) {
        res.json(JSON.parse(body))
    })
})

// 获取登录用户的动态
app.get('/api/dynamic', (req, res) => {
    cookie = req.query.cookie
    request({
        url: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new',
        method:'GET',
        headers: {
            cookie: req.query.cookie
        },
        qs: {
            uid: req.query.userid,
            type_list: 268435455,
            from: "weball",
            platform: "web"
        }
    },function (error,response, body) {
        res.json(JSON.parse(body))
    })
})

// 获取mikan更新磁力链接
app.get('/api/magent', (req, res) => {
    request({
        url: 'https://mikanani.me/Home/Classic',
        method:'GET'
    },function (error,response, body) {  
        const $ = cheerio.load(body)
        let results = []
        $("tbody").children('tr').each((i, ele) => {
            let dows = $(ele).children("td").eq(4).children("a").attr("href")
            dows = dows.slice(19,-8)
            results.push({
                time:$(ele).children("td").eq(0).text(),
                auth:$(ele).children("td").eq(1).text().replace(/\s+/g,""),
                name:$(ele).children("td").eq(2).text().slice(0,-6),
                size:$(ele).children("td").eq(3).text(),
                dow:`magnet:?xt=urn:btih:${dows}`
            })
        })
        res.send(results)
    })
})

// 获取mikan首页更新信息
app.get('/api/main', (req, res) => {
    request({
        url: 'https://mikanani.me/',
        method:'GET'
    },function (error,response, body) {
        const $ = cheerio.load(body)
        let results = []
        let evr = []
        $(".sk-bangumi").each((i,eles) => {
            let day = $(eles).children(".row").text().replace(/(^\s*)|(\s*$)/g, "")
            $(eles).children(".an-box").children(".list-inline").each((i,ele) => {
                $(ele).children("li").each((i,result) => {
                    //console.log($(result).children("div").text() + $(result).children("a").text() + $(result).children("a").attr("href"))
                    let img = `https://mikanani.me/${$(result).children("span").attr("data-src")}`
                    let id = $(result).children("span").attr("data-bangumiid")
                    let contentText = $(result).children(".text-center").text()
                    $(result).children(".an-info").children(".an-info-group").each((i,info) => {
                        let time = $(info).children("div").text()
                        let name = $(info).children("a").text()
                        let infos = {
                            time,
                            name,
                            img,
                            contentText,
                            id
                        }
                        evr.push(infos)
                    })
                })
                
            })
            results.push({data:{day:day,results:evr}})
            evr = []
        }) 
        res.send(results)
    })
})

// 获取点击动漫块详细页左边字幕组栏信息
app.get('/api/subtitle', (req, res) => {
    request({
        url: 'https://mikanani.me/Home/ExpandBangumi?bangumiId=' + req.query.id + '&showSubscribed=false',
        method:'GET'
    },function (error,response, body) {
        const $ = cheerio.load(body)
        let results = []
        $('.res-left').children(".list-unstyled").each((i,eles) => {
            $(eles).children('li').each((i,item) => {
                results.push($(item).children(".tag-res-name").text())
            })
        })
        res.send(results)
    })    
})

// 获取点击动漫块详细页中间磁力链接信息
app.get('/api/moreinfo', (req,res) => {
    request({
        url: 'https://mikanani.me/Home/ExpandBangumi?bangumiId=' + req.query.id + '&showSubscribed=false',
        method:'GET'
    },function (error,response, body) {
        const $ = cheerio.load(body)
        let results = []
        $('.res-mid-frame').each((i,eles) => {
            let result = []
            $(eles).children(".res-mid").children(".list-unstyled").each((i,items) => {
                $(items).children("li").each((i,item) => {
                    let name = $(item).children(".word-wrap").children("a").eq(0).text()
                    let magent = $(item).children(".word-wrap").children("a").eq(1).attr("data-clipboard-text")
                    let time = $(item).children(".res-date").text()
                    result.push({
                        name,
                        magent,
                        time
                    })
                })
                
            })
            results.push(result)
        })
        res.send(results)
    })   
})
 
// 获取搜漫的搜索结果
app.get('/api/results', (req,res) => {
    request({
        url: 'https://api.soman.com/soman.ashx',
        method: 'GET',
        qs: {
            action: 'getsomancomics2',
            pageindex: '1',
            pagesize: '20',
            keyword: req.query.key,
            time: Date.now()
        }
    },function (error,response, body) {  
        res.send(JSON.parse(body))
    })    
})

// 获取访问用户点击该话的信息  (总页数、用户浏览携带XMANHUA_VIEWSIGN
//  COMIC_MID、XMANHUA_CTITLE等)
app.get('/api/firstinfo', (req, res) => {
    request({
        url: 'http://www.mangabz.com/' + req.query.curl + '/',
        method: 'GET'
    }, function (error, response, body) {
        let myRe = /MANGABZ_VIEWSIGN="(.*?)";/g
        let myRe_time = /MANGABZ_VIEWSIGN_DT="(.*?)";/g
        let myRe_count = /MANGABZ_IMAGE_COUNT=(\d+?);/g
        let myRe_mid = /MANGABZ_MID=(\d+?);/g
        // let myRe_chapter = /class="right">共(\d+?)話</g
        let result = body.match(myRe)[0]
        let time = body.match(myRe_time)[0]
        let count = body.match(myRe_count)[0]
        let mid = body.match(myRe_mid)[0]
        // let chapter = body.match(myRe_chapter)
        time = time.slice(21,-2)
        let day = time.slice(0,10)
        let hour = time.slice(-8,-6)
        let second = time.slice(-6)
        result = result.slice(18,-2)
        count = count.slice(20,-1)
        mid = mid.slice(12,-1)
        // chapter = chapter.slice(1,-1)
        data = {
            day,
            hour,
            second,
            result,
            count,
            mid
        }
        res.send(data)
    })
})

// 获取当前首页阅读页面的编号
app.get('/api/getpage',(req, res) => {
    request({
        url: 'http://www.mangabz.com/' + req.query.curl + '/chapterimage.ashx?cid=' + (req.query.curl.slice(-5)) + '&page=1&key=&_cid=' + (req.query.curl.slice(-5)) + '&_mid=' + req.query.mid +'&_dt=' + req.query.day + "+"  + req.query.hour + encodeURIComponent(req.query.second) + '&_sign=' + req.query.sign,
        headers: {
            Referer: 'http://www.mangabz.com/' + req.query.curl + '/'
        }
    },function (error, response, body) {
        let myRe_page = /(\d+?)_(.+?)\|\|function/g
        let myRe_sign = /dm5imagefun\|(.+?)\|/g
        let page = body.match(myRe_page)[0]
        let pageSign = body.match(myRe_sign)[0]
        page = page.slice(0,6)
        pageSign = pageSign.slice(12,-1)
        data = {
            page,
            pageSign
        }
        res.send(data)
    })
})

// 获取指定页数
app.get('/api/getNumberpage',(req, res) => {
    request({
        url: 'http://www.mangabz.com/' + req.query.curl + '/chapterimage.ashx?cid=' + (req.query.curl.slice(-5)) + '&page=' + req.query.pageNumber + '&key=&_cid=' + (req.query.curl.slice(-5)) + '&_mid=' + req.query.mid +'&_dt=' + req.query.day + "+"  + req.query.hour + encodeURIComponent(req.query.second) + '&_sign=' + req.query.sign,
        headers: {
            Referer: 'http://www.mangabz.com/' + req.query.curl + '/'
        }
    },function (error, response, body) {
        let myRe_page = /\|(\d*?)_(.+?)\|\|function/g
        let page = body.match(myRe_page)[0]
        page = page.slice(1,-10)
        res.send(page)
    })
})


// Hpoi 手办模型界面信息
app.get('/api/gethpoiinfo',(req, res) => {
    request({
        url: 'https://www.hpoi.net/hobby/dynamicBox/ajax/',
        method:'POST',
        gzip: true,
        qs: {
            categoryId: 100,
            subType: req.query.subType
        }
    },function (error,response, body) {
        let data = []
        const $ = cheerio.load(body)
        $(".hpoi-conter-left").each((i,eles) => {
            let spaninfo = $(eles).children(".left-leioan").text()
            let img = $(eles).children(".left-leioan").children("a").children("img").attr("src")
            let type = $(eles).children(".right-leioan").children("div").eq(0).children("span").eq(0).text()
            let time = $(eles).children(".right-leioan").children("div").eq(0).children("span").eq(1).text()
            let message = $(eles).children(".right-leioan").children("div").eq(1).children("span").text()
            let info = $(eles).children(".right-leioan").children("div").eq(3).text()
            let bottom = $(eles).children(".right-leioan").children("div").eq(4).text()
            spaninfo = spaninfo.replace(/\ +/g,"")
            spaninfo = spaninfo.replace(/[\r\n]/g,"")
            data.push({
                spaninfo, 
                img, 
                type, 
                time, 
                message, 
                info, 
                bottom
            })
        })
        res.send(data)
    })
})


/* 监听端口 */
app.listen(3001, () => {
  console.log('listen:3001');
})