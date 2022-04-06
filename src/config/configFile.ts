class BasicConfig {
    type: string | undefined;
    host: string | undefined;
    protocol: string | undefined;
    apiKey: string | undefined;
    queryCondition: Object | undefined;
    outputPath: string | undefined;
    
    constructor(props: any) {
        this.type = props['type'] || "WH";
        this.host = props['host'] || 'wallhaven.cc';
        this.protocol = props['protocol'] || 'https';
        this.apiKey = props['apiKey'] || '';
        this.queryCondition = props['queryCondition'] || {
            'purity': 111,
            'sorting': 'random',
            'order': 'desc'
        };
        this.outputPath = props['outputPath'] || '.';
    }
}

enum PicLibType {
    WH = "wallHaven",
    KH = "ka",
    YD = "yere",
}

let globalConfig = new Array<BasicConfig>();
globalConfig.push(new BasicConfig({
    type: PicLibType.WH,
    host: 'wallhaven.cc',
    outputPath: "D:\\temp\\wh"
}))
export default globalConfig;
