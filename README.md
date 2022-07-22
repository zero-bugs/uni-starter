## uni-starter

#### for new project, first use
> npx prisma init

#### every time you change prisma.schema
> npx prisma generate


#### build map between prisma.schema and db
> npx prisma migrate dev --name init

#### format prisma.schema 
>npx prisma format

#### validate schema file valid or not
>npx prisma validate

TODO LIST
1、下载失败（读写数据流写入文件）后产生失败任务，加入线程池进行重试；
2、最新几天列表，读取并下载，一步完成；

IDE parameter:
Node Options: --loader ts-node/esm --trace-warnings
RUST_BACKTRACE=full

#### WH API READ
1、categories 100/101/111*  /etc (general/anime/people) Turn categories on(1) or off(0)
2、purity 100*/110/111/etc (sfw/sketchy/nsfw) Turn purities on(1) or off(0) NSFW requires a valid API key
3、sorting date_added*, relevance, random, views, favorites, toplist Method of sorting results

