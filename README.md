# 前端缓存

web缓存主要指的是两部分：**浏览器缓存** 和 **http缓存**。

其中**http缓存**是web缓存的核心，是最难懂的那一部分，也是最重要的那一部分。

浏览器缓存比如：`localStorage`, `sessionStorage`, `cookie` 等等。这些功能主要用于缓存一些必要的数据，比如用户信息。比如需要携带到后端的参数。亦或者是一些列表数据等等。

不过这里需要注意。像 `localStorage`，`sessionStorage` 这种用户缓存数据的功能，他只能保存5M左右的数据，多了不行。`cookie` 则更少，大概只能有 `4kb` 的数据。

这篇文章重点讲解的是：前端**http缓存**。

前端缓存逻辑图：

![前端缓存](./images/%E5%89%8D%E7%AB%AF%E7%BC%93%E5%AD%98.png)

http缓存官方介绍：Web 缓存是可以自动保存常见文档副本的 HTTP 设备。当 Web 请求抵达缓存时， 如果本地有“已缓存的”副本，就可以从本地存储设备而不是原始服务器中提取这个文档。

> 注意，我们的缓存主要是针对html,css,img等静态资源，常规情况下，我们不会去缓存一些动态资源，因为缓存动态资源的话，数据的实时性就不会不太好，所以我们一般都只会去缓存一些不太容易被改变的静态资源。

## 缓存可以解决什么问题？他的缺点是什么？

先说说，缓存可以解决什么问题。

- 减少不必要的网络传输，节约宽带（就是省钱）
- 更快的加载页面（就是加速）
- 减少服务器负载，避免服务器过载的情况出现。（就是减载）

再说说缺点

- 占内存（有些缓存会被存到内存中）

其实日常的开发中，我们最最最最关心的，还是"更快的加载页面"; 尤其是对于react/vue等SPA（单页面）应用来说，首屏加载是老生常谈的问题。这个时候，缓存就显得非常重要。不需要往后端请求，直接在缓存中读取。速度上，会有显著的提升。是一种提升网站性能与用户体验的有效策略。

http缓存又分为两种两种缓存，**强制缓存**和**协商缓存**,我们来深度剖析一下强制缓存和协商缓存各自的优劣以及他们的使用场景以及使用原理

**http缓存流程图↓**

![http缓存流程图](./images/http%E7%BC%93%E5%AD%98%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

## 强制缓存

强制缓存，我们简称强缓存。

从强制缓存的角度触发，如果浏览器判断请求的目标资源有效命中强缓存，如果命中，则可以直接从内存中读取目标资源，无需与服务器做任何通讯。

### 基于 `Expires` 字段实现的强缓存

在以前，我们通常会使用响应头的 `Expires` 字段去实现强缓存。如下图↓

![Expires实现强缓存](./images/Expires%E5%AE%9E%E7%8E%B0%E5%BC%BA%E7%BC%93%E5%AD%98.png)

`Expires` 字段的作用是，设定一个强缓存时间。在此时间范围内，则从内存（或磁盘）中读取缓存返回。

比如说将某一资源设置响应头为: `Expires: new Date("2022-7-30 23:59:59")`；

那么，该资源在 2022-7-30 23:59:59 之前，都会去本地的磁盘（或内存）中读取，不会去服务器请求。

但是，`Expires` 已经被废弃了。对于强缓存来说，`Expires` 已经不是实现强缓存的首选。

因为 `Expires` 判断强缓存是否过期的机制是: **获取本地时间戳**，并对先前拿到的资源文件中的 `Expires` 字段的时间做比较。来判断是否需要对服务器发起请求。这里有一个巨大的漏洞：“如果我本地时间不准咋办？”

是的，`Expires` 过度依赖本地时间，如果本地与服务器时间不同步，就会出现资源无法被缓存或者资源永远被缓存的情况。所以，`Expires` 字段几乎不被使用了。现在的项目中，我们并不推荐使用 `Expires` ，强缓存功能通常使用 `Cache-control` 字段来代替 `Expires` 字段。

### 基于 `Cache-control` 实现的强缓存（代替 `Expires` 的强缓存实现方法）

`Cache-control` 这个字段在http1.1中被增加，`Cache-control` 完美解决了 `Expires` 本地时间和服务器时间不同步的问题。是当下的项目中实现强缓存的最常规方法。

`Cache-control` 的使用方法也很简单，只要在资源的响应头上写上需要缓存多久就好了，单位是秒。比如↓

```js
//往响应头中写入需要缓存的时间
res.writeHead(200,{
    'Cache-Control':'max-age=10'
});
```

下图的意思就是，从该资源第一次返回的时候开始，往后的10秒钟内如果该资源被再次请求，则从缓存中读取。

![Cache-Control实现强缓存](./images/Cache-Control%E5%AE%9E%E7%8E%B0%E5%BC%BA%E7%BC%93%E5%AD%98.png)

`Cache-Control: max-age=N`，`N` 就是需要缓存的秒数。从第一次请求资源的时候开始，往后 `N` 秒内，资源若再次请求，则直接从磁盘（或内存中读取），不与服务器做任何交互。

`Cache-control` 中因为 `max-age` 后面的值是一个滑动时间，从服务器第一次返回该资源时开始倒计时。所以也就不需要比对客户端和服务端的时间，解决了 `Expires` 所存在的巨大漏洞。

`Cache-control` 有 `max-age`、`s-maxage`、`no-cache`、`no-store`、`private`、`public`这六个属性。

- `max-age` 决定客户端资源被缓存多久。
- `s-maxage` 决定代理服务器缓存的时长。
- `no-cache` 表示是强制进行协商缓存。
- `no-store` 是表示禁止任何缓存策略。
- `public` 表示资源即可以被浏览器缓存也可以被代理服务器缓存。
- `private` 表示资源只能被浏览器缓存。

#### `no-cache` 和 `no-store`

`no_cache` 是 `Cache-control` 的一个属性。它并不像字面意思一样禁止缓存，实际上，`no-cache` 的意思是强制进行协商缓存。如果某一资源的 `Cache-control` 中设置了 `no-cache`，那么该资源会直接跳过强缓存的校验，直接去服务器进行协商缓存。而 `no-store` 就是禁止所有的缓存策略了。

> 注意，`no-cache` 和 `no-store` 是一组互斥属性，这两个属性不能同时出现在 `Cache-Control` 中。

#### `public` 和 `private`

一般请求是从客户端直接发送到服务端，如下↓

![客户端-服务器](./images/%E5%AE%A2%E6%88%B7%E7%AB%AF-%E6%9C%8D%E5%8A%A1%E5%99%A8.png)

但有些情况下是例外的：比如，出现代理服务器，如下↓

![客户端-代理-服务器](./images/%E5%AE%A2%E6%88%B7%E7%AB%AF-%E4%BB%A3%E7%90%86-%E6%9C%8D%E5%8A%A1%E5%99%A8.png)

而 `public` 和 `private` 就是决定资源是否可以在代理服务器进行缓存的属性。

其中，`public` 表示资源在客户端和代理服务器都可以被缓存。

`private` 则表示资源只能在客户端被缓存，拒绝资源在代理服务器缓存。

如果这两个属性值都没有被设置，则默认为 `private`。

> 注意，`public` 和 `private` 也是一组互斥属性。他们两个不能同时出现在响应头的 `Cache-control` 字段中。

#### `max-age` 和 `s-maxage`

`max-age` 表示的时间资源在客户端缓存的时长，而 `s-maxage` 表示的是资源在代理服务器可以缓存的时长。

在一般的项目架构中 `max-age` 就够用。

而 `s-maxage` 因为是代理服务端的缓存时长，他必须和上面说的 `public` 属性一起使用（`public` 属性表示资源可以在代理服务器中缓存）。

> 注意，`max-age` 和 `s-maxage` 并不互斥。他们可以一起使用。

那么，`Cache-control` 如何设置多个值呢？用逗号分割，如下↓

`Cache-control:max-age=10000,s-maxage=200000,public`

强制缓存就是以上这两种方法了。现在我们回过头来聊聊，`Expires` 难道就一点用都没有了吗？也不是，虽然 `Cache-control` 是 `Expires` 的完全替代品，但是如果要考虑向下兼容的话，在 `Cache-control` 不支持的时候，还是要使用 `Expires`，这也是我们当前使用的这个属性的唯一理由。

## 协商缓存

服务端在响应头中设置 `Cache-control:no-cache` 后表示客户端需要与服务端通信才能确定是取**本地的缓存**还是**服务端上的资源**。

该策略可以在**不确定资源是否会发生改变**或**不确定资源的有效期**时使用。

### 基于 `last-modified` 的协商缓存

基于 `last-modified` 的协商缓存实现步骤为:

1. 在服务器端读出文件修改时间；
2. 将读出来的修改时间赋给响应头的 `last-modified` 字段；
3. 设置响应头 `Cache-control:no-cache`

如下图↓

![基于last-modified的协商缓存](./images/%E5%9F%BA%E4%BA%8Elast-modified%E7%9A%84%E5%8D%8F%E5%95%86%E7%BC%93%E5%AD%98.png)

注意圈出来的部分。

- 读出修改时间。
- 给该资源响应头的 `last-modified` 字段赋值修改时间
- 给该资源响应头的 `Cache-Control` 字段值设置为 `:no-cache` .(上文有介绍，`Cache-control:no-cache` 的意思是跳过强缓存校验，直接进行协商缓存。)

还没完。到这里还无法实现协商缓存。

当客户端读取到 `last-modified` 的时候，会在下次的请求标头中携带一个字段 `:If-Modified-Since`。

![If-Modified-Since](./images/If-Modified-Since.png)

而这个请求头中的 `If-Modified-Since` 就是第一次请求资源时服务端设置的 `last-modified`，也就是这行代码：

```js
'last-modified': mtime.toUTCString(),
```

那么之后每次对该资源的请求，都会带上 `If-Modified-Since` 这个字段，而服务端就需要拿到这个时间并再次读取该资源的修改时间，让他们两个做一个比对来决定是读取缓存还是返回新的资源。

如图↓

![last-modified协商缓存对比修改时间](./images/last-modified%E5%8D%8F%E5%95%86%E7%BC%93%E5%AD%98%E5%AF%B9%E6%AF%94%E4%BF%AE%E6%94%B9%E6%97%B6%E9%97%B4.png)

这样，就是基于 `last-modified` 的协商缓存的所有操作了。流程图如下↓

![last-modified协商缓存流程图](./images/last-modified%E5%8D%8F%E5%95%86%E7%BC%93%E5%AD%98%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

使用以上方式的协商缓存已经存在两个非常明显的漏洞。这两个漏洞都是基于文件是通过比较修改时间来判断是否更改而产生的。

1. 因为是更具文件修改时间来判断的，所以，在文件内容本身不修改的情况下，依然有可能更新文件修改时间（比如修改文件名再改回来），这样，就有可能文件内容明明没有修改，但是缓存依然失效了。

2. 当文件在极短时间内完成修改的时候（比如几百毫秒）。因为文件修改时间记录的最小单位是秒，所以，如果文件在几百毫秒内完成修改的话，文件修改时间不会改变，这样，即使文件内容修改了，依然不会返回新的文件。

为了解决上述的这两个问题。从http1.1开始新增了一个头信息，`ETag`(Entity 实体标签)

### 基于 `ETag` 的协商缓存

`ETag` 就是将原先协商缓存的**比较时间戳**的形式修改成了**比较文件指纹**。

> 文件指纹:根据文件内容计算出的唯一哈希值。文件内容一旦改变则指纹改变。

我们来看一下流程↓

1. 第一次请求某资源的时候，服务端读取文件并计算出文件指纹，将文件指纹放在响应头的 `etag` 字段中跟资源一起返回给客户端。
2. 第二次请求某资源的时候，客户端自动从缓存中读取出上一次服务端返回的 `ETag` 也就是文件指纹。并赋给请求头的 `if-None-Match` 字段，让上一次的文件指纹跟随请求一起回到服务端。
3. 服务端拿到请求头中的 `is-None-Match` 字段值（也就是上一次的文件指纹），并再次读取目标资源并生成文件指纹，两个指纹做对比。如果两个文件指纹完全吻合，说明文件没有被改变，则直接返回 `304` 状态码和一个空的响应体并 `return` 。如果两个文件指纹不吻合，则说明文件被更改，那么将新的文件指纹重新存储到响应头的 `ETag` 中并返回给客户端。

代码图例↓

![Etag协商缓存代码图例](./images/Etag%E5%8D%8F%E5%95%86%E7%BC%93%E5%AD%98%E4%BB%A3%E7%A0%81%E5%9B%BE%E4%BE%8B.png)

流程示例图↓

![Etag协商缓存流程图](./images/Etag%E5%8D%8F%E5%95%86%E7%BC%93%E5%AD%98%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

> 从校验流程上来说，协商缓存的修改时间比对和文件指纹比对，几乎是一样的。

#### `ETag` 也有缺点

`ETag` 需要计算文件指纹，这样意味着服务端需要更多的计算开销。如果文件尺寸大，数量多，并且计算频繁，那么 `ETag` 的计算就会影响服务器的性能。显然，`ETag` 在这样的场景下就不是很适合。

`ETag` 有强验证和弱验证，所谓将强验证，`ETag` 生成的哈希码深入到每个字节。哪怕文件中只有一个字节改变了，也会生成不同的哈希值，它可以保证文件内容绝对的不变。但是，强验证非常消耗计算量。`ETag` 还有一个弱验证，弱验证是提取文件的部分属性来生成哈希值。因为不必精确到每个字节，所以他的整体速度会比强验证快，但是准确率不高。会降低协商缓存的有效性。

值得注意的一点是，不同于 `cache-control` 是 `expires` 的完全替代方案(说人话:能用`cache-control`就不要用`expiress`)。`ETag` 并不是 `last-modified` 的完全替代方案。而是 `last-modified` 的补充方案（说人话：项目中到底是用 `ETag` 还是 `last-modified` 完全取决于业务场景，这两个没有谁更好谁更坏）。

## 如何设置缓存

从前端的角度来说:

- 什么都不用干，缓存是缓存在前端，但实际上代码是后端的同学来写的。如果你需要实现前端缓存的话，通知后端的同学加响应头就好了。

从后端的角度来说:

- 请参考文章，虽然文章里的后端是使用 `node.js` 写的，但写了详细的注释。不难看懂

## 总结

- http缓存可以减少宽带流量，加快响应速度。

- 关于强缓存，`Cache-control` 是 `Expires` 的完全替代方案，在可以使用 `Cache-control` 的情况下不要使用 `Expires`。

- 关于协商缓存, `etag` 并不是 `last-modified` 的完全替代方案，而是补充方案，具体用哪一个，取决于业务场景。

- 有些缓存是从磁盘读取，有些缓存是从内存读取，有什么区别？答：从内存读取的缓存更快。

- 所有带 `304` 的资源都是协商缓存，所有标注（from memory cache/从内存中读取/from disk cache/从磁盘中读取）的资源都是强缓存。

> 示例源码：<https://github.com/qiuxchao/http-cache-demo>

> 本篇参考：[中高级前端工程师都需要熟悉的技能--前端缓存](https://juejin.cn/post/7127194919235485733)
