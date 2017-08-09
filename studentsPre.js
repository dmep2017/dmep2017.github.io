// This script is for preprocessing purpose
// We run it to obtain all the avatars and store in our data structure directly

// Template string. New in ES6
var studentString = `祁鹏 https://joanna0520.github.io
陈明 https://chenming117.github.io
贾雨朦 https://jiayumengshirley.github.io
蓝星宇 https://olivialan.github.io
蒋津津 https://sherryjiangjinjin.github.io
曾奕珊 https://zengyishan.github.io
吴扬 https://young331.github.io
张凌云 https://lyrtclouds.github.io
苏洁 https://susieca.github.io
梁轶琳 https://elaineliang.github.io
王文浩 https://winhows5.github.io
于文澜 https://Wenlan5.github.io
王敏 https://wangmin1221.github.io
叶霄麒 https://siukay.github.io
陈雪 https://snowflakes176x.github.io
张晓雨 https://mystica1994.github.io
李嘉欣 https://jessielee1230.github.io
JuliannaWu https://juliannawqy.github.io
梁轶琳 https://elaineliang.github.io
赵欣 https://cicindyzhao.github.io
邵海涵 https://brandworld.github.io
陈嘉慧 https://trishsky.github.io/`

var students = studentString.split('\n').map(function(s) {
    var parts = s.split(' ')
    var name = parts[0]
    var url = parts[1]
    var githubHandle = url.split('//')[1].split('.')[0]
    return {
        name: name,
        url: url,
        githubHandle: githubHandle
    }
})

students.forEach(function(element) {
    $.getJSON(`//api.github.com/users/${element.githubHandle}`, function(res) {
        element.avatarUrl = res.avatar_url
    })
})