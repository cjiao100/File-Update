const http = require('http');
const fs = require('fs');
const querystring = require('querystring');

const server = http.createServer((req, res) => {
  const boundary = `--${
    querystring.parse(req.headers['content-type'].split('; ')[1])['boundary']
  }`;
  let arr = [];
  req.on('data', data => arr.push(data));
  req.on('end', () => {
    let buffer = Buffer.concat(arr);

    // 使用分隔符分割数据
    let result = bufferSplit(buffer, boundary);
    // 去掉头部和尾部的数据
    result.pop();
    result.shift();

    // 遍历删除头尾部的\r\n
    result = result.map(item => item.slice(2, item.length - 2));

    // 删除内容中间的\r\n\r\n
    result.forEach(item => {
      // info是数据元信息，data是数据信息，数据保持为buffer类型
      let [info, ...data] = bufferSplit(item, '\r\n\r\n');
      info = info.toString();
      let [, name, fileName] = info
        .split('; ')
        .map(item => querystring.parse(item));
        
      // 格式化数据
      name = format(name.name);

      if (data.toString() === '') {
        // 如果内容不存在，返回404，提示对应内容不存在
        res.writeHead(404, {
          'Content-Type': 'text/plain;charset=utf-8'
        });
        res.end(`${name}不能为空`);
      } else {
        // 内容不为空，判断数据类型是否为file文件
        if (name === 'file') {
          // 获取文件名
          fileName = format(fileName.filename).split('\r\n')[0];
          
          // 处理数据
          data = Buffer.concat(data);

          // 将文件存储到服务器
          fs.writeFile(`./upload/${fileName}`, data, err => {
            if (err) {
              console.log(err);
            } else {
              res.writeHead(404, {
                'Content-Type': 'text/html;charset=utf-8'
              });
              // TODO
              res.end(`
                <h1>上传成功</h1>
                <hr />
                <img height="400" src="http://localhost:5500/demo1/upload/${fileName}">
              `)
            }
          });
        } else {
          // 数据为数值，则直接获取字段名和值
          console.log(info);
          console.log(data.toString());
        }
      }
    });
  });
});
server.listen(8080);

function bufferSplit(buffer, separator) {
  let result = [];
  let index = 0;

  while ((index = buffer.indexOf(separator)) != -1) {
    result.push(buffer.slice(0, index));
    buffer = buffer.slice(index + separator.length);
  }
  result.push(buffer);

  return result;
}

function format(str) {
  return str.replace(/\"/g, '');
}
