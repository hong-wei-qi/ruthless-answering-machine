const express = require("express"); // web應用框架
const app = express();

const http = require("http").Server(app); // 後端運行連線

const url = require("url"); // 網址操作
const qs = require("querystring"); // 解析回傳值(post)
const path = require("path"); // 取得檔案
const fs = require("fs"); // 操作實體檔案

const modules = {
    fs: fs
}

const database_json = require("./database_json/main");
// DB_json = new database_json("D:/PowerAD/.DemoCode/DBjson")
const DB_json = new database_json("./DBjson", modules)

// const template = require("./document/template.json")

// ==============================

// 建立連線
http.listen(80, () => { console.log("[無情的答題機器]127.0.0.1:80/index") });

// 頁面請求
const pageGet = (filename, res, req) => {
    const pageList = ["subject", "questionbank", "reslut"]
    fs.readFile(`./page/${filename}.html`, (error, data) => {
        if (error) {
            pageSendError(res)
        } else {
            if (pageList.indexOf(filename) === -1) {
                pageSend(res, data)
            } else {
                data = data.toString();
                if (filename === "subject") {
                    getTest(res, req, data)
                } else if (filename === "questionbank") {
                    getQuestionBank(res, req, data)
                } else if (filename === "reslut") {
                    getReslut(res, req, data)
                }
            }
        }
    })
}

// 頁面發送
const pageSend = (res, html) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(html);
}
// 頁面錯誤發送
const pageSendError = (res) => {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("page get error.");
}

// 文件請求
const documentGet = (req, res, type) => {
    let filetype = req.query.filetype;
    let filename = req.query.filename;
    let file, ContentType
    if (filename && filetype) {
        if (type === "977se") {
            // css & js
            file = `${filetype}/${filename}`
            ContentType = "text"
        } else if (type === "q0eax") {
            // 圖片
            file = `img/${filename}`
            ContentType = "image"
        }
        fs.readFile(file, (error, data) => {
            if (error) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.end(`${ContentType} get error.`);
            } else {
                res.statusCode = 200;
                res.setHeader("Content-Type", `${ContentType}/${filetype}`)
                res.end(data);
            }
        })
    } else {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end(`documentGet get error.`);
    }
}
app.get("/document/:type", (req, res) => {
    let type = req.params.type;
    documentGet(req, res, type);
})
// "english_b", "english_c", "chinese",
// const subjectList = ["english_a", "accountancy", "math", "pe"]

app.get("/index", (req, res) => {
    pageGet("index", res, req);
})
app.get("/questionbank", (req, res) => {
    pageGet("questionbank_index", res, req);
})
app.get("/questionbank/:subject", (req, res) => {
    pageGet("questionbank", res, req);
})
app.get("/test/:subject", (req, res) => {
    let subject = req.params.subject;
    // if (subjectList.indexOf(subject) === -1) {
    //     res.redirect("/index");
    //     res.end();
    //     return
    // }
    pageGet("subject", res, req);
})
app.get("/reslut/:id", (req, res) => {
    pageGet("reslut", res, req);
})


const setQuestionList = (datas, num) => {
    let reList = []
    for (let i = 0; i < num; i++) {
        let index = Math.floor(Math.random() * datas.length);
        reList.push(datas[index])
        datas.splice(index, 1);
    }
    return reList
}
const questionTemplate = '<div><span>{{ Qnum }}.</span><span>{{ question }}</span><div><label><input type="radio" name="{{ Qnum }}" onclick="user_answers[\'{{ id }}\'] = \'A\'"><span>{{ A }}</span></label><br><label><input type="radio" name="{{ Qnum }}" onclick="user_answers[\'{{ id }}\'] = \'B\'"><span>{{ B }}</span></label><br><label><input type="radio" name="{{ Qnum }}" onclick="user_answers[\'{{ id }}\'] = \'C\'"><span>{{ C }}</span></label><br><label><input type="radio" name="{{ Qnum }}" onclick="user_answers[\'{{ id }}\'] = \'D\'"><span>{{ D }}</span></label></div></div>'
const getTest = (res, req, page) => {
    let subject = req.params.subject;
    let num = parseInt(req.query.num);
    let setting = {
        title: ["*"]
    }
    let questions = DB_json.select(subject, setting)
    let questionList = setQuestionList(questions.content, num)
    let requestion = "", Qnum = 1
    for (let i = 0; i < questionList.length; i++) {
        const q = questionList[i];
        if (!(q)) {
            continue;
        }
        requestion += questionTemplate
                    .replace(/{{ Qnum }}/g, Qnum)
                    .replace("{{ question }}", q[1])
                    .replace(/{{ id }}/g, q[0])
                    .replace("{{ A }}", q[2][0])
                    .replace("{{ B }}", q[2][1])
                    .replace("{{ C }}", q[2][2])
                    .replace("{{ D }}", q[2][3])
        Qnum++
    }
    num = (Qnum-1 < num) ? Qnum-1 : num;
    page = page.replace("{{ question }}", requestion)
                .replace(/{{ subject }}/g, subject)
                .replace(/{{ num }}/g, num)
    pageSend(res, page)
}
const questionBankTemplate = '<div><span>{{ question }}</span><div><span style="{{ AA }}">{{ A }}</span><br><span style="{{ AB }}">{{ B }}</span><br><span style="{{ AC }}">{{ C }}</span><br><span style="{{ AD }}">{{ D }}</span></div></div>'
const getQuestionBank = (res, req, page) => {
    let subject = req.params.subject;
    let setting = {
        title: ["*"]
    }
    let questions = DB_json.select(subject, setting)
    let requestion = "", num = questions.content.length
    questions.content.forEach(q => {
        // console.log(q[0]);
        let str = questionBankTemplate
                    .replace("{{ question }}", q[1])
                    .replace("{{ A }}", q[2][0])
                    .replace("{{ B }}", q[2][1])
                    .replace("{{ C }}", q[2][2])
                    .replace("{{ D }}", q[2][3])
        switch (q[3]) {
            case "A":
                str = str.replace("{{ AA }}", "color: red")
                        .replace("{{ AB }}", "")
                        .replace("{{ AC }}", "")
                        .replace("{{ AD }}", "")
                break;
            case "B":
                str = str.replace("{{ AA }}", "")
                        .replace("{{ AB }}", "color: red")
                        .replace("{{ AC }}", "")
                        .replace("{{ AD }}", "")
                break;
            case "C":
                str = str.replace("{{ AA }}", "")
                        .replace("{{ AB }}", "")
                        .replace("{{ AC }}", "color: red")
                        .replace("{{ AD }}", "")
                break;
            case "D":
                str = str.replace("{{ AA }}", "")
                        .replace("{{ AB }}", "")
                        .replace("{{ AC }}", "")
                        .replace("{{ AD }}", "color: red")
                break;
        }
        requestion += str
    })
    page = page.replace("{{ question }}", requestion)
                .replace(/{{ subject }}/g, subject)
                .replace("{{ num }}", num)
    pageSend(res, page)
}
// let reslut_user_answers = {
//     // "id": "uesr_ans"
// }
// let reslut_subject
const reslutTemplate = '<div><span>{{ question }}</span><div><span style="{{ AA }}{{ UA }}">{{ A }}</span><br><span style="{{ AB }}{{ UB }}">{{ B }}</span><br><span style="{{ AC }}{{ UC }}">{{ C }}</span><br><span style="{{ AD }}{{ UD }}">{{ D }}</span></div></div>'
const getReslut = (res, req, page) => {
    let reslut_id = req.params.id;
    let setting = {
        title: ["*"],
        where: {
            and: [["id", "=", parseInt(reslut_id)]]
        }
    }
    let reslut_user_answers = (DB_json.select("reslut", setting)).content[0]
    setting = {
        title: ["*"]
    }
    let questions = DB_json.select(reslut_user_answers[1], setting)
    let score, num = 0, scoreNum = 0
    let requestion = "", reslut_questions = []
    Object.keys(reslut_user_answers[2]).forEach(n => {
        reslut_questions.push(questions.content[n-1])
        num++
    })
    reslut_questions.forEach(q => {
        let str = reslutTemplate
                    .replace("{{ question }}", q[1])
                    .replace("{{ A }}", q[2][0])
                    .replace("{{ B }}", q[2][1])
                    .replace("{{ C }}", q[2][2])
                    .replace("{{ D }}", q[2][3])
        switch (q[3]) {
            case "A":
                str = str.replace("{{ AA }}", "color: green;")
                        .replace("{{ AB }}", "")
                        .replace("{{ AC }}", "")
                        .replace("{{ AD }}", "")
                break;
            case "B":
                str = str.replace("{{ AA }}", "")
                        .replace("{{ AB }}", "color: green;")
                        .replace("{{ AC }}", "")
                        .replace("{{ AD }}", "")
                break;
            case "C":
                str = str.replace("{{ AA }}", "")
                        .replace("{{ AB }}", "")
                        .replace("{{ AC }}", "color: green;")
                        .replace("{{ AD }}", "")
                break;
            case "D":
                str = str.replace("{{ AA }}", "")
                        .replace("{{ AB }}", "")
                        .replace("{{ AC }}", "")
                        .replace("{{ AD }}", "color: green;")
                break;
        }
        if (q[3] == reslut_user_answers[2][q[0]]) {
            str = str.replace("{{ UA }}", "")
                    .replace("{{ UB }}", "")
                    .replace("{{ UC }}", "")
                    .replace("{{ UD }}", "")
            scoreNum++
        } else {
            switch (reslut_user_answers[2][q[0]]) {
                case "A":
                    str = str.replace("{{ UA }}", "color: red;")
                            .replace("{{ UB }}", "")
                            .replace("{{ UC }}", "")
                            .replace("{{ UD }}", "")
                    break;
                case "B":
                    str = str.replace("{{ UA }}", "")
                            .replace("{{ UB }}", "color: red;")
                            .replace("{{ UC }}", "")
                            .replace("{{ UD }}", "")
                    break;
                case "C":
                    str = str.replace("{{ UA }}", "")
                            .replace("{{ UB }}", "")
                            .replace("{{ UC }}", "color: red;")
                            .replace("{{ UD }}", "")
                    break;
                case "D":
                    str = str.replace("{{ UA }}", "")
                            .replace("{{ UB }}", "")
                            .replace("{{ UC }}", "")
                            .replace("{{ UD }}", "color: red;")
                    break;
            }
        }
        requestion += str
    })
    score = parseInt((scoreNum / num) * 100)
    page = page.replace("{{ reslut }}", requestion)
                .replace(/{{ subject }}/g, reslut_user_answers[1])
                .replace("{{ score }}", `${score}　`)
                .replace("{{ scoreNum }}", `　${scoreNum}`)
                .replace("{{ num }}", num)
    pageSend(res, page)
}

// 改答案！
app.post("/correct/radio", (req, res) => {
    var data = []
    req.on("data", (check) => {
        data.push(check);
    });
    req.on("end", () => {
        data = Buffer.concat(data).toString();
        data = qs.parse(data);
        // data = {
        //     "subject": "string", 科目
        //     "num": "int", 題數
        //     "user_answers": { "id": "A-D",... } 作答
        // }
        let reslut_user_answers = {}
        let subject = data.subject, num = parseInt(data.num)
        delete data.subject
        delete data.num
        let setting = {
            title: ["*"]
        }
        let questions = DB_json.select(subject, setting)
        let len = questions.content.length, user_questions = [], scoreNum = 0
        if (data) {
            
        }
        Object.keys(data).forEach(n => {
            user_questions.push(parseInt(n))
        })
        for (let i = 0; i < len; i++) {
            if (user_questions.indexOf(i+1) === -1) {
                continue;
            }
            reslut_user_answers[`${i+1}`] = data[i+1]
            if (reslut_user_answers[`${i+1}`] === questions.content[i][3]) {
                scoreNum++
            }
        }
        // reslut_subject = subject
        let insertData = {
            content:[
                [null, subject, reslut_user_answers]
            ]
        }
        DB_json.insertInto("reslut", insertData)
        setting = {
            title: ["*"],
            order: [["id", -1]]
        }
        let id = (DB_json.select("reslut", setting)).content[0][0]
        let score = parseInt((scoreNum / num) * 100)
        res.send([score, `${scoreNum}/${num}`, id]);
        res.statusCode = 200;
        res.end()
    })
})