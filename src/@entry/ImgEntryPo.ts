export type ImgEntryPo = {
    id: string;
    url: string;
    short_url: string;
    views: number;
    favorites: number;
    source: string;
    purity: string;
    category: string;
    dimension_x: number;
    dimension_y: number;
    resolution: string;
    ratio: string;
    file_size: number;
    file_type: string;
    created_at: string;
    path: string;
};

export type ResDataMetaPo = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    query: string;
    seed: string;
};

export type ResImgEntryPo = {
    data: ImgEntryPo[];
    meta: ResDataMetaPo;
};
