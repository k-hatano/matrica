// F=[-3,6,-3,-6,-1,-6,-1,-1,2,-1,2,1,-1,1,-1,4,3,4,3,6]
// ﾅ=[-1,1,-3,1,-3,-1,-1,-1,-1,-3,-2,-5,0,-5,1,-3,1,-1,3,-1,3,1,1,1,1,3,-1,3]
// ←=[1,4,1,1,-1,-1,-3,-1,-3,1,-6,-2,-3,-5,-3,-3,0,-3,3,0,3,4]
// ｲ=[5,5,-5,0,-5,-2,-1,0,-1,-6,1,-6,1,1,5,3]
// □=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,-1,-1,-1,-1,-1,0,0,-1,-1,1,-1,1,1,-1]

var matrix;
var point;
var defined;
var dist;
var origMax;
var cnvSize;
var max;
var mess;
var caut;
var selection;
var lastClicked;
var tempMatrix;

onload = function() {
    matrix = new Array(0);
    point = new Array(0);
    defined = {};

    max = 10;
    cnvSize = 500;
    dist - 1;
    selection = -1;
    lastClicked = 0;
    temp = "";

    var graph = document.getElementById("graph");
    graph.onmousedown = function(e) {
        graphMouseDown(e);
    };
    graph.onmouseup = function(e) {
        graphMouseUp(e);
    };
    graph.onmouseover = function(e) {
        graphMouseOver(e);
    };
    graph.onmouseout = function(e) {
        graphMouseOut(e);
    };
    graph.onmousemove = function(e) {
        graphMouseMove(e);
    };

    drawGraph();
};

function getMatrixFromArray(str) {
    str = str.replace(/\ /g, "");
    if (str.match(/^([0-9\.\+\-\*\/\(\)]+)$/)) {
        // 普通の式 例: (1+23)*(4-56)
        var res;
        mess = "" + RegExp.$1;
        try {
            res = eval(RegExp.$1);
            res = "" + parseFloat(res);
        } catch (ex) {
            caut = "式に誤りがあります";
            return undefined;
        }
        return res;
    } else if (str.match(/^(\-?[0-9]+\.?[0-9]*)$/)) {
        // スカラー 例: 12.34
        var res = RegExp.$1;
        return res;
    } else if (str.match(/^\((\-?[0-9]+\.?[0-9]*)\+([0-9]+\.?[0-9]*)([ij])\)?$/)) {
        // 複素数の行列表現(強引)
        var re = parseFloat(RegExp.$1);
        var im = parseFloat(RegExp.$2);
        var res = "" + re + "," + im + "," + (-im) + "," + re;
        mess = "(" + re + "+" + im + RegExp.$3 + ")";
        return res;
    } else if (str.match(/^\((\-?[0-9]+\.?[0-9]*)\-([0-9]+\.?[0-9]*)[ij]\)?$/)) {
        // 複素数の行列表現(強引)
        var re = parseFloat(RegExp.$1);
        var im = parseFloat(RegExp.$2);
        var res = "" + re + "," + -im + "," + (im) + "," + re;
        mess = "(" + re + "-" + im + RegExp.$3 + ")";
        return res;
    } else if (str.match(/^\[(\-?[0-9]+\.?[0-9]*)\,(\-?[0-9]+\.?[0-9]*)\]?$/)) {
        // ベクトル 例: [1,-2,0.5,1]
        var res = RegExp.$1 + "," + RegExp.$2;
        return res;
    } else if (str.match(/^\[([0-9\-\,\.]*)\]?$/)) {
        // カンマ区切りの場合は列ベクトル単位で入力
        var res = RegExp.$1;
        var arr = res.split(",");
        if (arr.length == 1) return res;
        if (arr.length % 2 == 0) return res;
        if (arr.length % 3 == 0) return res;
        return undefined;
    } else if (str.match(/^\[([0-9\-\;\.]*)\]?$/)) {
        // セミコロン区切りの場合は行ベクトル単位で入力（直感的ではないが）
        var res = RegExp.$1;
        var tmpArr = res.split(";");
        var arr = new Array();
        if (tmpArr.length == 1) return tmpArr;
        if (tmpArr.length % 2 == 0) {
            for (var i = 0; i < tmpArr.length; i++) {
                arr[i] = tmpArr[(i % 2) * (tmpArr.length / 2) + (Math.floor(i / 2)) ];
            }
            return arr.join(",");
        }
        if (tmpArr.length % 3 == 0) {
            for (var i = 0; i < tmpArr.length; i++) {
                arr[i] = tmpArr[(i % 3) * (tmpArr.length / 3) + (Math.floor(i / 3)) ];
            }
            return arr.join(",");
        }
        return undefined;
    } else if (str.match(/^([A-Za-z])$/)) {
        // 行列
        var a = RegExp.$1;
        mess = "" + a;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        return matrix[defined[a]];
    } else if (str.match(/^([A-Za-z])([A-Za-z])$/)) {
        // 行列の積
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "" + a + b;
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        b = matrix[defined[b]].split(",");
        res = multiplyMatrix(a, b);
        if (res == undefined){
            if ((a.length == 2 && b.length == 2) || (a.length == 3 && b.length == 3)) {
                caut = "ベクトルの内積を計算する場合は、「*」を挟んで記述してください";
            } else {
                caut = "これらの行列の積を計算することはできません";
            }
        }
        return res;
    } else if (str.match(/^([A-Za-z]+)$/)) {
        // 行列の積(3行列以上)
        var res = "1";
        var i;
        str = RegExp.$1;
        mess = "" + str;
        for (i = 0; i < str.length; i++) {
            var a = str.charAt(i);
            if (defined[a] == undefined) {
                caut = "行列" + a + "が定義されていません";
                return undefined;
            }
            res = res.split(",");
            a = matrix[defined[a]].split(",");
            res = multiplyMatrix(res, a);
            if (res == undefined) {
                caut = "これらの行列の積を計算することはできません";
                return undefined;
            }
        }
        return res;
    } else if (str.match(/^([A-Za-z])\^T\*?([A-Za-z])$/)) {
        // ベクトルの内積(転置を用いた記述)
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "" + a + "<sup>T</sup>" + b;
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        b = matrix[defined[b]].split(",");
        var res = innerProduct(a, b);
        if (res == undefined) {
            caut = "これらのベクトルの内積を計算することはできません";
            return undefined;
        }
        return res;
    } else if (str.match(/^([A-Za-z])\*([A-Za-z])$/)) {
        // ベクトルの内積(*を用いた記述)
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "" + a + "･" + b;
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        b = matrix[defined[b]].split(",");
        var res = innerProduct(a, b);
        if (res == undefined) {
            caut = "これらのベクトルの内積を計算することはできません";
            return undefined;
        }
        return res;
    } else if (str.match(/^\<([A-Za-z])\,([A-Za-z])\>?$/)) {
        // ベクトルの内積(<,>を用いた記述)
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "&lt;" + a + "," + b + "&gt;";
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        b = matrix[defined[b]].split(",");
        var res = innerProduct(a, b);
        if (res == undefined) {
            caut = "これらのベクトルの内積を計算することはできません";
            return undefined;
        }
        return res;
    } else if (str.match(/^([A-Za-z])\*\*([A-Za-z])$/)) {
        // ベクトルの外積(**を用いた記述)
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "" + a + "×" + b;
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        b = matrix[defined[b]].split(",");
        var res = exteriorProduct(a, b);
        if (res == undefined) {
            caut = "これらのベクトルの外積を計算することはできません";
            return undefined;
        }
        return res;
    } else if (str.match(/^\|\|([A-Za-z])\|\|$/)) {
        // ベクトルの長さ
        var a = RegExp.$1;
        mess = "||" + a + "||";
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        var res = euclidNorm(a);
        if (res == undefined) {
            caut = "このベクトルの長さを計算することはできません";
            return undefined;
        }
        return res;
    } else if (str.match(/^([A-Za-z])\+([A-Za-z])$/)) {
        // 行列の和
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "" + a + "+" + b;
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        b = matrix[defined[b]].split(",");
        if (a.length != b.length) {
            caut = "これらの行列の和を計算することはできません";
            return undefined;
        }
        var res = "";
        for (i = 0; i < b.length; i++) {
            var n = parseFloat(a[i]) + parseFloat(b[i]);
            res += "" + n + ",";
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if (str.match(/^([A-Za-z])\-([A-Za-z])$/)) {
        // 行列の差
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "" + a + "-" + b;
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        b = matrix[defined[b]].split(",");
        if (a.length != b.length) {
            caut = "これらの行列の差を計算することはできません";
            return undefined;
        }
        var res = "";
        for (i = 0; i < b.length; i++) {
            var n = parseFloat(a[i]) - parseFloat(b[i]);
            res += "" + n + ",";
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if (str.match(/^([A-Za-z])\^\-1$/)) {
        // 逆行列
        var a = RegExp.$1;
        mess = "" + a + "<sup>-1</sup>";
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        if (a.length == 1) {
            if (a[0] == 0) {
                caut = "この行列の逆行列は存在しません";
                return undefined;
            }
            var res = "" + (1 / a[0]);
            return res;
        } else if (a.length == 4) {
            if (a[0] * a[3] - a[1] * a[2] == 0) {
                caut = "この行列の逆行列は存在しません";
                return undefined;
            }
            var res = "";
            res += "" + (a[3] / (a[0] * a[3] - a[1] * a[2])) + ",";
            res += "" + (-a[1] / (a[0] * a[3] - a[1] * a[2])) + ",";
            res += "" + (-a[2] / (a[0] * a[3] - a[1] * a[2])) + ",";
            res += "" + (a[0] / (a[0] * a[3] - a[1] * a[2]));
            return res;
        } else if (a.length == 9) {
            var det = "" + (a[0] * a[4] * a[8] + a[1] * a[5] * a[6] + a[2] * a[3] * a[7] - a[2] * a[4] * a[6] - a[1] * a[3] * a[8] - a[0] * a[5] * a[7]);
            if (det == 0) {
                caut = "この行列の逆行列は存在しません";
                return undefined;
            }
            var res = "";
            res += "" + ((a[4] * a[8] - a[7] * a[5]) / det) + ",";
            res += "" + ((a[7] * a[2] - a[1] * a[8]) / det) + ",";
            res += "" + ((a[1] * a[5] - a[4] * a[2]) / det) + ",";
            res += "" + ((a[6] * a[5] - a[3] * a[8]) / det) + ",";
            res += "" + ((a[0] * a[8] - a[6] * a[2]) / det) + ",";
            res += "" + ((a[3] * a[2] - a[0] * a[5]) / det) + ",";
            res += "" + ((a[3] * a[7] - a[6] * a[4]) / det) + ",";
            res += "" + ((a[6] * a[1] - a[0] * a[7]) / det) + ",";
            res += "" + ((a[0] * a[4] - a[3] * a[1]) / det);
            return res;
        }
        caut = "この行列の逆行列を計算することはできません";
        return undefined;
    } else if (str.match(/^([A-Za-z])\^T$/)) {
        // 転置
        var a = RegExp.$1;
        mess = "" + a + "<sup>T</sup>";
        var i, x, y;
        var res = "";
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        if (a.length == 1) {
            res = a[0];
            return res;
        } else if (a.length == 4) {
            for (x = 0; x < 2; x++) {
                for (y = 0; y < 2; y++) {
                    res += "" + a[x + y * 2] + ",";
                }
            }
            res = res.slice(0, res.length - 1);
            return res;
        } else if (a.length == 9) {
            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res += "" + a[x + y * 3] + ",";
                }
            }
            res = res.slice(0, res.length - 1);
            return res;
        }
        caut = "結果の行列が非対応な形式になるため、この行列の転置行列は計算できません";
        return undefined;
    } else if (str.match(/^([A-Za-z])\^([0-9]+)$/)) {
        // 行列のべき乗
        var a = RegExp.$1;
        var b = RegExp.$2;
        var res = "1";
        var i;
        mess = "" + a + "<sup>" + b + "</sup>";
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[RegExp.$1]].split(",");
        if (a.length == 1) res = "1";
        if (a.length == 4) res = "1,0,0,1";
        if (a.length == 9) res = "1,0,0,0,1,0,0,0,1";
        for (i = 0; i < parseInt(b); i++) {
            res = res.split(",");
            a = matrix[defined[RegExp.$1]].split(",");
            res = multiplyMatrix(res, a);
            if (res == undefined) {
                caut = "この行列のべき乗を計算することはできません";
                return undefined;
            }
        }
        return res;
    } else if (str.match(/^(\-?[0-9]+\.?[0-9]*)([A-Za-z])$/)) {
        // 行列のスカラー倍
        var a = RegExp.$1;
        var b = RegExp.$2;
        mess = "" + str;
        if (defined[b] == undefined) {
            caut = "行列" + b + "が定義されていません";
            return undefined;
        }
        a = new Array(1);
        a[0] = parseFloat(RegExp.$1);
        b = matrix[defined[RegExp.$2]].split(",");
        res = multiplyMatrix(a, b);
        return res;
    } else if (str.match(/^det\(?([A-Za-z])\)?$/)) {
        // 行列式(detを用いた記述)
        var a = RegExp.$1;
        mess = "det(" + a + ")";
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        res = determinant(a);
        if (res == undefined) {
            caut = "この行列の行列式を計算することはできません";
            return undefined;
        }
        return res;
    } else if (str.match(/^\|([A-Za-z])\|$/)) {
        // 行列式(||を用いた記述)
        var a = RegExp.$1;
        mess = "|" + a + "|";
        var i;
        if (defined[a] == undefined) {
            caut = "行列" + a + "が定義されていません";
            return undefined;
        }
        a = matrix[defined[a]].split(",");
        res = determinant(a);
        if (res == undefined) {
            if (a.length <= 3) {
                caut = "ベクトルの長さを計算する場合は、||〜||と記述してください";
            } else {
                caut = "この行列の行列式を計算することはできません";
            }
            return undefined;
        }
        return res;
    } else if (str.match(/^([EI])_([123])$/)) {
        // 単位行列
        var a = RegExp.$1;
        var b = RegExp.$2;
        var res = "";
        var x, y;
        mess = a + "<sub>" + b + "</sub>";
        for (y = 0; y < b; y++) {
            for (x = 0; x < b; x++) {
                res += (x == y ? "1," : "0,");
            }
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if (str.match(/^O_([123])$/)) {
        // ゼロ行列
        var a = RegExp.$1;
        var res = "";
        var x, y;
        mess = "O<sub>" + a + "</sub>";
        for (y = 0; y < a; y++) {
            for (x = 0; x < a; x++) {
                res += "0,";
            }
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if (str.match(/^g_([123])$/)) {
        // 重心ベクトル(?)
        var a = RegExp.$1;
        var res = "";
        var x, n;
        mess = "g<sub>" + a + "</sub>";
        n = 1 / a;
        for (x = 0; x < a; x++) {
            res += "" + n + ",";
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if (str.match(/^R\((-?[0-9]+\.?[0-9]*)\)?$/)) {
        // 回転行列
        var a = RegExp.$1;
        var res = "";
        var x, y;
        mess = "R(" + a + ")";
        var rad = Math.PI * parseFloat(a) / 180.0;
        res += "" + Math.cos(rad) + ",";
        res += "" + Math.sin(rad) + ",";
        res += "" + (-1) * Math.sin(rad) + ",";
        res += "" + Math.cos(rad);
        return res;
    } else if (str.match(/^R_?x\((-?[0-9]+\.?[0-9]*)\)?$/)) {
        // 回転行列(3次ベクトルでx軸を回転軸とする)
        var a = RegExp.$1;
        var res = "";
        var x, y;
        mess = "R<sub>x</sub>(" + a + ")";
        var rad = Math.PI * parseFloat(a) / 180.0;
        res += "" + 1 + ",";
        res += "" + 0 + ",";
        res += "" + 0 + ",";
        res += "" + 0 + ",";
        res += "" + Math.cos(rad) + ",";
        res += "" + Math.sin(rad) + ",";
        res += "" + 0 + ",";
        res += "" + (-1) * Math.sin(rad) + ",";
        res += "" + Math.cos(rad);
        return res;
    } else if (str.match(/^R_?y\((-?[0-9]+\.?[0-9]*)\)?$/)) {
        // 回転行列(3次ベクトルでy軸を回転軸とする)
        var a = RegExp.$1;
        var res = "";
        var x, y;
        mess = "R<sub>y</sub>(" + a + ")";
        var rad = Math.PI * parseFloat(a) / 180.0;
        res += "" + Math.cos(rad) + ",";
        res += "" + 0 + ",";
        res += "" + (-1) * Math.sin(rad) + ",";
        res += "" + 0 + ",";
        res += "" + 1 + ",";
        res += "" + 0 + ",";
        res += "" + Math.sin(rad) + ",";
        res += "" + 0 + ",";
        res += "" + Math.cos(rad);
        return res;
    } else if (str.match(/^R_?z\((-?[0-9]+\.?[0-9]*)\)?$/)) {
        // 回転行列(3次ベクトルでz軸を回転軸とする)
        var a = RegExp.$1;
        var res = "";
        var x, y;
        mess = "R<sub>z</sub>(" + a + ")";
        var rad = Math.PI * parseFloat(a) / 180.0;
        res += "" + Math.cos(rad) + ",";
        res += "" + Math.sin(rad) + ",";
        res += "" + 0 + ",";
        res += "" + (-1) * Math.sin(rad) + ",";
        res += "" + Math.cos(rad) + ",";
        res += "" + 0 + ",";
        res += "" + 0 + ",";
        res += "" + 0 + ",";
        res += "" + 1;
        return res;
    }

    return undefined;
}

function roundMilli(n) {
    if (n == "") return "";
    return Math.round(n * 1000) / 1000;
}

function multiplyMatrix(a, b) {
    var i;
    if (a.length == 1) {
        var res = "";
        for (i = 0; i < b.length; i++) {
            var n = a[0] * b[i];
            res += "" + n + ",";
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if (a.length == 4 && b.length % 2 == 0) {
        var res = "";
        for (i = 0; i < b.length; i++) {
            var n = a[i % 2] * b[Math.floor(i / 2) * 2] + a[i % 2 + 2] * b[Math.floor(i / 2) * 2 + 1];
            res += "" + n + ",";
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if ((a.length % 3 == 0 && a.length % 2 != 0) && (b.length % 3 == 0 && b.length % 2 != 0)) {
        var res = "";
        for (i = 0; i < b.length; i++) {
            var n = a[i % 3] * b[Math.floor(i / 3) * 3] + a[i % 3 + 3] * b[Math.floor(i / 3) * 3 + 1] + a[i % 3 + 6] * b[Math.floor(i / 3) * 3 + 2];
            res += "" + n + ",";
        }
        res = res.slice(0, res.length - 1);
        return res;
    } else if (a.length == 6 && (b.length % 3 == 0 && b.length % 2 != 0)) {
        var res = "";
        for (i = 0; i < a.length * b.length / 3 / 3; i++) {
            var n = a[i % 2] * b[Math.floor(i / 2) * 3] + a[i % 2 + 2] * b[Math.floor(i / 2) * 3 + 1] + a[i % 2 + 4] * b[Math.floor(i / 2) * 3 + 2];
            res += "" + n + ",";
        }
        res = res.slice(0, res.length - 1);
        return res;
    }
    return undefined;
}

function determinant(a) {
    if (a.length == 1) {
        return a[0];
    } else if (a.length == 4) {
        var res = "" + (a[0] * a[3] - a[1] * a[2]);
        return res;
    } else if (a.length == 9) {
        var res = "" + (a[0] * a[4] * a[8] + a[1] * a[5] * a[6] + a[2] * a[3] * a[7] - a[2] * a[4] * a[6] - a[1] * a[3] * a[8] - a[0] * a[5] * a[7]);
        return res;
    }
    return undefined;
}

function innerProduct(a, b) {
    if (a.length == 1 && b.length == 1) {
        var res = parseFloat(a[0] * b[0]);
        return "" + res;
    } else if (a.length == 2 && b.length == 2) {
        var res = parseFloat(a[0] * b[0]) + parseFloat(a[1] * b[1]);
        return "" + res;
    } else if (a.length == 3 && b.length == 3) {
        var res = parseFloat(a[0] * b[0]) + parseFloat(a[1] * b[1]) + parseFloat(a[2] * b[2]);
        return "" + res;
    }
    return undefined;
}

function exteriorProduct(a, b) {
    if (a.length == 3 && b.length == 3) {
        var res = "" + parseFloat(a[1] * b[2] - a[2] * b[1]) + "," + parseFloat(a[2] * b[0] - a[0] * b[2]) + "," + parseFloat(a[0] * b[1] - a[1] * b[0]);
        return res;
    }
    return undefined;
}

function euclidNorm(a) {
    if (a.length == 1) {
        var res = Math.sqrt(parseFloat(a[0] * a[0]));
        return "" + res;
    } else if (a.length == 2) {
        var res = Math.sqrt(parseFloat(a[0] * a[0]) + parseFloat(a[1] * a[1]));
        return "" + res;
    } else if (a.length == 3) {
        var res = Math.sqrt(parseFloat(a[0] * a[0]) + parseFloat(a[1] * a[1]) + parseFloat(a[2] * a[2]));
        return "" + res;
    }
    return undefined;
}

function getMatrixHTMLTag(str, varname, idno) {
    var arr = str.split(",");
    var formulaHtml = "";
    var i;
    if (arr.length == 1) {
        if (idno == undefined) {
            formulaHtml += "<table><tr>";
        } else {
            formulaHtml += "<table class='definedFormula' id='formula_" + idno + "' onclick='matrixClicked(" + idno + ")'><tr>";
        }
        if (varname != undefined) {
            formulaHtml += "<td nowrap='nowrap'>" + varname + " =</td>";
        }
        formulaHtml += "<td nowrap='nowrap'>" + roundMilli(arr[0]) + "</td>";
        if (idno != undefined) {
            formulaHtml += "<td><input type='button' value='削除' class='deleteButton' onclick='deleteMatrix(" + idno + ")' /></td>";
        }

        formulaHtml += "</tr></table>";
        return formulaHtml;
    } else if (arr.length % 2 == 0) {
        if (idno == undefined) {
            formulaHtml += "<table><tr>";
        } else {
            formulaHtml += "<table class='definedFormula' id='formula_" + idno + "' onclick='matrixClicked(" + idno + ")'><tr>";
        }
        if (varname != undefined) {
            formulaHtml += "<td rowspan='2' nowrap='nowrap'>" + varname + " =</td>";
        }
        formulaHtml += "<td rowspan='2' class='paren'>[</td>";
        for (i = 0; i < arr.length / 2; i++) {
            formulaHtml += "<td nowrap='nowrap'>" + roundMilli(arr[i * 2]) + "</td>";
        }
        formulaHtml += "<td rowspan='2' class='paren'>]</td>";
        if (idno != undefined) {
            formulaHtml += "<td rowspan='2'><input type='button' value='削除' class='deleteButton' onclick='deleteMatrix(" + idno + ")' /></td>";
        }
        formulaHtml += "</tr><tr>";
        for (i = 0; i < arr.length / 2; i++) {
            formulaHtml += "<td nowrap='nowrap'>" + roundMilli(arr[i * 2 + 1]) + "</td>";
        }

        formulaHtml += "</tr></table>";
        return formulaHtml;
    } else if (arr.length % 3 == 0) {
        if (idno == undefined) {
            formulaHtml += "<table><tr>";
        } else {
            formulaHtml += "<table class='definedFormula' id='formula_" + idno + "' onclick='matrixClicked(" + idno + ")'><tr>";
        }
        if (varname != undefined) {
            formulaHtml += "<td rowspan='3' nowrap='nowrap'>" + varname + " =</td>";
        }
        formulaHtml += "<td rowspan='3' class='paren3'>[</td>";
        for (i = 0; i < arr.length / 3; i++) {
            formulaHtml += "<td nowrap='nowrap'>" + roundMilli(arr[i * 3]) + "</td>";
        }
        formulaHtml += "<td rowspan='3' class='paren3'>]</td>";
        if (idno != undefined) {
            formulaHtml += "<td rowspan='3'><input type='button' value='削除' class='deleteButton' onclick='deleteMatrix(" + idno + ")' /></td>";
        }
        formulaHtml += "</tr><tr>";
        for (i = 0; i < arr.length / 3; i++) {
            formulaHtml += "<td nowrap='nowrap'>" + roundMilli(arr[i * 3 + 1]) + "</td>";
        }
        formulaHtml += "</tr><tr>";
        for (i = 0; i < arr.length / 3; i++) {
            formulaHtml += "<td nowrap='nowrap'>" + roundMilli(arr[i * 3 + 2]) + "</td>";
        }

        formulaHtml += "</tr></table>";
        return formulaHtml;
    }

    return undefined;
}

function executeFormula(str) {
    var textInput = document.getElementById("input");
    var formulasDiv = document.getElementById("formulas");
    var definedDiv = document.getElementById("defined");
    var tempDiv = document.getElementById("temp");
    var formulaHtml;
    var mat;
    mess = undefined;
    caut = undefined;

    str = str.replace(/\ /g, "");
    if (str == "") {
        tempDiv.innerHTML = "";
        temp = "";
        drawGraph();
        showMessage('式を入力してください 例: M=[1,-2,0.5,1] p=[1,2] q=Mp');
        return;
    } else if (str.match(/^([A-Za-z_])\=(.*)$/)) {
        var v = RegExp.$1;
        var vo = v;
        str = RegExp.$2;
        mat = getMatrixFromArray(str);
        if (mat != undefined) {
            if (mess != undefined) vo = v + " = " + mess + "";
            formulaHtml = getMatrixHTMLTag(mat, "" + vo, matrix.length);
            definedDiv.innerHTML += formulaHtml;
            tempDiv.innerHTML = "";
            temp = "";
            formulasDiv.scrollTop = formulasDiv.scrollHeight;
            point.push(mat);
            matrix.push(mat);
            defined[v] = matrix.length - 1;
            textInput.value = "";

            for (var i = 0; i < point.length; i++) {
                var str2 = point[i];
                var arr = str2.split(",");
                if (arr.length % 2 == 0) {
                    for (var j = 0; j < arr.length / 2; j++) {
                        var xx = Math.floor(Math.abs(arr[j * 2])) + 1;
                        var yy = Math.floor(Math.abs(arr[j * 2 + 1])) + 1;
                        if (xx > max) max = xx;
                        if (yy > max) max = yy;
                    }
                } else if (arr.length % 3 == 0) {
                    for (var j = 0; j < arr.length / 3; j++) {
                        var xx = Math.floor(Math.abs(arr[j * 3])) + 1;
                        var yy = Math.floor(Math.abs(arr[j * 3 + 1])) + 1;
                        if (xx > max) max = xx;
                        if (yy > max) max = yy;
                    }
                }
            }

            drawGraph();
            showMessage("行列" + v + "を定義しました");
            return;
        }
    } else {
        var vo = undefined;
        mat = getMatrixFromArray(str);
        if (mat != undefined) {
            if (mess != undefined) vo = mess;
            formulaHtml = getMatrixHTMLTag(mat, vo, undefined);
            tempDiv.innerHTML = formulaHtml;
            temp = mat;
            formulasDiv.scrollTop = formulasDiv.scrollHeight;
            drawGraph();
            showMessage("一時的な行列の計算結果を表示しています");
            return;
        }
    }

    if (caut == undefined) showCaution("式に誤りがあるか、式に対応していません");
    else showCaution(caut);
}

function inputFormula() {
    var textInput = document.getElementById("input");
    var str = textInput.value;
    executeFormula(str);
}

function drawGraph() {
    var x, y, z, r;
    var cnvHalf = cnvSize / 2;

    var canvas = document.getElementById('graph');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cnvSize, cnvSize);

    var vec = document.getElementById("vector").checked;
    var sq = document.getElementById("square").checked;

    for (var i = 0; i < point.length; i++) {
        var str = point[i];
        var arr = str.split(",");
        if (arr.length > 0) {
            drawArray(ctx, arr, (selection >= 0 && i != selection) ? 0.1 : 1.0, vec, sq);
        }
    }

    var arr = temp.split(",");
    if (arr.length > 0) {
        drawArray(ctx, arr, (selection >= 0 && i != selection) ? 0.1 : 0.4, vec, sq);
    }

    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";

    ctx.beginPath();
    ctx.moveTo(cnvHalf, cnvSize);
    ctx.lineTo(cnvHalf, 0);
    ctx.moveTo(0, cnvHalf);
    ctx.lineTo(cnvSize, cnvHalf);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cnvHalf + 4, 6);
    ctx.lineTo(cnvHalf, 0);
    ctx.lineTo(cnvHalf - 4, 6);
    ctx.stroke();
    ctx.moveTo(cnvSize - 6, cnvHalf - 4);
    ctx.lineTo(cnvSize, cnvHalf);
    ctx.lineTo(cnvSize - 6, cnvHalf + 4);
    ctx.stroke();

    ctx.font = "18px serif";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText("O", cnvHalf - 4, cnvHalf + 18);

    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText("x", cnvSize - 12, cnvHalf + 18);

    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText("y", cnvHalf - 4, 18);

    if (dist >= 0) {

        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText("" + max, cnvHalf + 4, 18);

        ctx.fillStyle = "black";
        ctx.textAlign = "right";
        ctx.fillText("" + max, cnvSize - 12, cnvHalf - 4);
    }
}

function drawArray(ctx, arr, alpha, vec, sq) {
    var x, y, z, r, rad, len;
    var cnvHalf = cnvSize / 2;

    if (arr.length % 2 == 0) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        if ((arr.length == 2 && vec) || (arr.length == 4 && sq)) {
            for (var j = 0; j < arr.length; j += 2) {
                ctx.beginPath();
                x = cnvHalf;
                y = cnvHalf;
                ctx.moveTo(x, y);
                x = cnvHalf + cnvHalf * (arr[j] / max);
                y = cnvHalf - cnvHalf * (arr[j + 1] / max);
                ctx.lineTo(x, y);
                ctx.stroke();

                ctx.beginPath();
                rad = Math.atan2(arr[j + 1], arr[j]) + Math.PI;
                len = Math.sqrt(arr[j] * arr[j] + arr[j + 1] * arr[j + 1]);
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10.0 * Math.cos(rad - Math.PI / 8), y - 10.0 * Math.sin(rad - Math.PI / 8));
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10.0 * Math.cos(rad + Math.PI / 8), y - 10.0 * Math.sin(rad + Math.PI / 8));
                ctx.stroke();
            }
        } else {
            for (var j = 0; j < arr.length; j += 2) {
                x = cnvHalf + cnvHalf * (arr[j] / max);
                y = cnvHalf - cnvHalf * (arr[j + 1] / max);
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2, true);
                ctx.fill();
            }
            ctx.beginPath();
            x = cnvHalf + cnvHalf * (arr[arr.length - 2] / max);
            y = cnvHalf - cnvHalf * (arr[arr.length - 1] / max);
            ctx.moveTo(x, y);
            for (var j = 0; j < arr.length; j += 2) {
                x = cnvHalf + cnvHalf * (arr[j] / max);
                y = cnvHalf - cnvHalf * (arr[j + 1] / max);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = "1.0";
    } else if (arr.length % 3 == 0) {
        ctx.globalAlpha = alpha / 2;

        if ((arr.length == 3 && vec) || (arr.length == 9 && sq)) {
            ctx.fillStyle = "rgb(255, 0, 0)";
            ctx.strokeStyle = "rgb(255, 0, 0)";
            for (var j = 0; j < arr.length; j += 3) {
                ctx.beginPath();
                x = cnvHalf;
                y = cnvHalf;
                ctx.moveTo(x, y);
                z = parseFloat(arr[j + 2] / max * 5);
                r = Math.pow(2, arr[j + 2] / max);
                x = cnvHalf + cnvHalf * (arr[j] / max) * r - z;
                y = cnvHalf - cnvHalf * (arr[j + 1] / max) * r;
                ctx.lineTo(x, y);
                ctx.stroke();

                ctx.beginPath();
                rad = Math.atan2(arr[j + 1], arr[j]) + Math.PI;
                len = Math.sqrt(arr[j] * arr[j] + arr[j + 1] * arr[j + 1]);
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10.0 * Math.cos(rad - Math.PI / 8) * r, y - 10.0 * Math.sin(rad - Math.PI / 8) * r);
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10.0 * Math.cos(rad + Math.PI / 8) * r, y - 10.0 * Math.sin(rad + Math.PI / 8) * r);
                ctx.stroke();
            }

            ctx.fillStyle = "rgb(0, 255, 255)";
            ctx.strokeStyle = "rgb(0, 255, 255)";
            for (var j = 0; j < arr.length; j += 3) {
                ctx.beginPath();
                x = cnvHalf;
                y = cnvHalf;
                ctx.moveTo(x, y);
                z = parseFloat(arr[j + 2] / max * 5);
                r = Math.pow(2, arr[j + 2] / max);
                x = cnvHalf + cnvHalf * (arr[j] / max) * r + z;
                y = cnvHalf - cnvHalf * (arr[j + 1] / max) * r;
                ctx.lineTo(x, y);
                ctx.stroke();

                ctx.beginPath();
                rad = Math.atan2(arr[j + 1], arr[j]) + Math.PI;
                len = Math.sqrt(arr[j] * arr[j] + arr[j + 1] * arr[j + 1]);
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10.0 * Math.cos(rad - Math.PI / 8) * r, y - 10.0 * Math.sin(rad - Math.PI / 8) * r);
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10.0 * Math.cos(rad + Math.PI / 8) * r, y - 10.0 * Math.sin(rad + Math.PI / 8) * r);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = "rgb(255, 0, 0)";
            ctx.strokeStyle = "rgb(255, 0, 0)";
            ctx.beginPath();
            for (var j = 0; j < arr.length; j += 3) {
                z = parseFloat(arr[j + 2] / max * 5);
                r = Math.pow(2, arr[j + 2] / max);
                x = cnvHalf + cnvHalf * (arr[j] / max) * r - z;
                y = cnvHalf - cnvHalf * (arr[j + 1] / max) * r;
                ctx.beginPath();
                ctx.arc(x, y, 3 * r, 0, Math.PI * 2, true);
                ctx.fill();
            }
            ctx.beginPath();
            z = parseFloat(arr[arr.length - 1] / max * 5);
            r = Math.pow(2, arr[arr.length - 1] / max);
            x = cnvHalf + cnvHalf * (arr[arr.length - 3] / max) * r - z;
            y = cnvHalf - cnvHalf * (arr[arr.length - 2] / max) * r;
            ctx.moveTo(x, y);
            for (var j = 0; j < arr.length; j += 3) {
                z = parseFloat(arr[j + 2] / max * 5);
                r = Math.pow(2, arr[j + 2] / max);
                x = cnvHalf + cnvHalf * (arr[j] / max) * r - z;
                y = cnvHalf - cnvHalf * (arr[j + 1] / max) * r;
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = "rgb(0, 255, 255)";
            ctx.strokeStyle = "rgb(0, 255, 255)";
            ctx.beginPath();
            for (var j = 0; j < arr.length; j += 3) {
                z = parseFloat(arr[j + 2] / max * 5);
                r = Math.pow(2, arr[j + 2] / max);
                x = cnvHalf + cnvHalf * (arr[j] / max) * r + z;
                y = cnvHalf - cnvHalf * (arr[j + 1] / max) * r;
                ctx.beginPath();
                ctx.arc(x, y, 3 * r, 0, Math.PI * 2, true);
                ctx.fill();
            }
            ctx.beginPath();
            z = parseFloat(arr[arr.length - 1] / max * 5);
            r = Math.pow(2, arr[arr.length - 1] / max);
            x = cnvHalf + cnvHalf * (arr[arr.length - 3] / max) * r + z;
            y = cnvHalf - cnvHalf * (arr[arr.length - 2] / max) * r;
            ctx.moveTo(x, y);
            for (var j = 0; j < arr.length; j += 3) {
                z = parseFloat(arr[j + 2] / max * 5);
                r = Math.pow(2, arr[j + 2] / max);
                x = cnvHalf + cnvHalf * (arr[j] / max) * r + z;
                y = cnvHalf - cnvHalf * (arr[j + 1] / max) * r;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        ctx.globalAlpha = "1.0";
    }
}

function showMessage(str) {
    document.getElementById("message").innerText = str;
    document.getElementById("caution").innerText = "";
}

function showCaution(str) {
    document.getElementById("message").innerText = "";
    document.getElementById("caution").innerText = str;
}

function graphMouseOver(e) {
    showMessage('ドラッグするとグラフを拡大・縮小します');
}

function graphMouseDown(e) {
    if (e.button == 2) {
        var x = Math.round((e.offsetX - cnvSize / 2) / cnvSize * max * 2);
        var y = Math.round(-(e.offsetY - cnvSize / 2) / cnvSize * max * 2);
        executeFormula("(" + x + "," + y + ")");
    } else {
        var graph = document.getElementById('graph');
        var x = e.offsetX - cnvSize / 2;
        var y = e.offsetY - cnvSize / 2;
        origMax = max;
        dist = Math.sqrt(x * x + y * y);
    }
}

function graphMouseUp(e) {
    dist = -1;
    drawGraph();
}

function graphMouseOut(e) {
    dist = -1;
    drawGraph();
}

function graphMouseMove(e) {
    if (e.button == 2) {
        var x = Math.round((e.offsetX - cnvSize / 2) / cnvSize * max * 2);
        var y = Math.round(-(e.offsetY - cnvSize / 2) / cnvSize * max * 2);
        executeFormula("[" + x + "," + y + "]");
    } else {
        if (dist >= 0) {
            var currentDist;
            var graph = document.getElementById('graph');
            var x = e.offsetX - cnvSize / 2;
            var y = e.offsetY - cnvSize / 2;
            currentDist = Math.sqrt(x * x + y * y);
            max = Math.floor(origMax * (dist / currentDist));
            if (max <= 0) max = 1;
            drawGraph();
        }
    }
}

function matrixClicked(n) {
    var formula = document.getElementsByClassName("definedFormula");
    if (n == selection) n = -1;
    if (n >= 0 || lastClicked < 0) {
        selection = n;
        for (var i = 0; i < formula.length; i++) {
            if (formula[i].id == "formula_" + selection) {
                formula[i].className = "definedFormula selection";
            } else {
                formula[i].className = "definedFormula";
            }
        }
    }
    lastClicked = n;
    drawGraph();
}

function textFocus() {
    showMessage('式を入力してください 例: M=[1,-2,0.5,1] p=[1,2] q=Mp');
}

function deleteMatrix(idno) {
    var formula = document.getElementById("formula_" + idno);
    if (formula != undefined) {
        formula.className = "deleted";
    }
    point[idno] = "";
    drawGraph();
}

function inputDeterminant() {
    if (selection < 0) {
        showCaution("行列が選択されていません");
        return;
    }
    var formula = document.getElementById("formula_" + selection);
    var matrixName = formula.innerText.charAt(0);
    executeFormula( "det(" + matrixName + ")" );
}

function inputInversedMatrix() {
    if (selection < 0) {
        showCaution("行列が選択されていません");
        return;
    }
    var formula = document.getElementById("formula_" + selection);
    var matrixName = formula.innerText.charAt(0);
    executeFormula( matrixName + "^-1" );
}

function zoomIn() {
    dist = 1;
    max--;
    if (max <= 0) max = 1;
    drawGraph();
    dist = -1;
}

function zoomOut() {
    dist = 1;
    max++;
    drawGraph();
    dist = -1;
}