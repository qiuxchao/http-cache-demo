const http = require('http');
const fs = require('fs');
const etag = require('etag');

http.createServer((req, res) => {
  switch (req.url) {
    // 强缓存 Expires 实现
    case '/1.jpg': {
      const data = fs.readFileSync('./images/1.jpg');
      // 设置资源的过期时间，客户端会在过期前读取缓存
      res.writeHead(200, {
        Expires: new Date('2024-7-11 23: 59: 59').toUTCString()
      });
      res.end(data);
      return;
    }


    // 强缓存 Cache-Control 实现
    case '/2.jpg': {
      const data = fs.readFileSync('./images/2.jpg');
      // 设置资源在多少秒后过期，客户端会在过期前读取缓存
      res.writeHead(200, {
        'Cache-Control': 'max-age=10'
      });
      res.end(data);
      return;
    }

    // 协商缓存 last-modified 实现
    case '/3.jpg': {
      const data = fs.readFileSync('./images/3.jpg');
      // 读取资源修改时间
      const { mtime } = fs.statSync('./images/3.jpg');
      // 获取客户端那里的 If-Modified-Since 字段(也就是服务端上次设置的 last-modified)
      const ifModifiedSince = req.headers['if-modified-since'];
      // 对比上次的修改时间和本次是否一致
      if (ifModifiedSince === mtime.toUTCString()) {
        // 一致，说明资源没有改变，返回 304 让客户端读取缓存
        res.statusCode = 304;
        // 缓存已经生效了，这里不需要返回资源data
        res.end();
        return;
      }
      // 👇下面的代码只会在第一次和资源改变后执行
      // 设置资源最后修改时间 last-modified
      res.writeHead(200, {
        'last-modified': mtime.toUTCString(),
        // 跳过强缓存校验，直接进行协商缓存
        'CaChe-Control': 'no-cache'
      });
      res.end(data);
      return;
    }

    // 协商缓存 Etag 实现
    case '/4.jpg': {
      const data = fs.readFileSync('./images/4.jpg');
      // 生成资源唯一标识符
      const etagContent = etag(data);
      // 获取客户端那里的 If-none-match 字段(也就是服务端上次设置的 etag)
      const ifNoneMatch = req.headers['if-none-match'];
      // 对比文件指纹是否一致
      if (ifNoneMatch === etagContent) {
        // 一致，说明资源没有改变，返回 304 让客户端读取缓存
        res.statusCode = 304;
        // 缓存已经生效了，这里不需要返回资源data
        res.end();
        return;
      }
      // 👇下面的代码只会在第一次和资源改变后执行
      // 设置资源指纹，唯一标识
      res.writeHead(200, {
        'etag': etagContent,
        // 跳过强缓存校验，直接进行协商缓存
        'CaChe-Control': 'no-cache'
      });
      res.end(data);
      return;
    }
  }
}).listen(3000);

console.log('Server running at http://127.0.0.1:3000/');
