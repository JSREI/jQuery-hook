const fs = require('fs');
const parser = require('@babel/parser');
const generator = require('@babel/generator');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');
const {StringLiteral} = require("@babel/generator/lib/generators/types");
const {assertSourceType} = require("@babel/core/lib/config/validation/option-assertions");

// ------------------------------------------------ 依赖函数 ------------------------------------------------------------

/**
 * 把字符串转为code point数组
 *
 * @param str
 * @returns {number[]}
 */
function stringToCodePointArray(str) {
    return Array.from(str, function (char) {
        return char.codePointAt(0);
    });
}

/**
 * 把babel里的字符串替换为计算code point实时生成字符串的代码，用于隐藏字面值常量
 *
 * @param stringLiteral
 * @returns {ParseResult<Expression>}
 */
function stringLiteralToCodePointCode(stringLiteral) {
    const valueCodePointArray = stringToCodePointArray(stringLiteral);
    // 替换字符串
    const code = `String.fromCodePoint(${valueCodePointArray.join(', ')})`;
    return parser.parseExpression(code);
}

/**
 * 生成随机名称，用于对变量名称进行混淆
 *
 * @returns {string}
 */
function generateRandomName() {
    return `v_${Math.random().toString(36).substr(2, 8)}`;
}

// ---------------------------------------------------------------------------------------------------------------------


// 读取 submit-form-code.js 文件内容，对其进行一些基础的混淆
const code = fs.readFileSync('submit-form-code.js', 'utf8');

// 使用 Babel 解析代码
const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['*']
});

// 遍历 AST 并替换所有的字符串
traverse(ast, {
    // 直接的字面值常量
    StringLiteral(path) {
        path.parent.value = stringLiteralToCodePointCode(path.node.value);
    },
    // 函数调用的实参字符串也进行编码
    CallExpression(path) {
        const args = path.node.arguments;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (types.isStringLiteral(arg)) {
                args[i] = stringLiteralToCodePointCode(arg.value);
            }
        }
    }
});

// 重命名变量
traverse(ast, {
    // 遍历所有的变量声明
    VariableDeclarator(path) {
        const id = path.node.id;
        if (types.isIdentifier(id)) {
            // 生成新名称
            const newName = generateRandomName();
            // 重命名变量
            path.scope.rename(id.name, newName);
        }
    }
});

// 将修改后的 AST 转换回代码
const output = generator.default(ast, {  // 配置选项，例如文件名、代码格式等
    sourceMaps: true,
    retainLines: true,
    comments: false,
    minified: false,
}, code);

// 输出结果
console.log(output.code);