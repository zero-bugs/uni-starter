import {ImgEntryPo} from "../@entry/ImgEntryPo.js";
import {pmsClient} from "./Utils.js";
import {ImgDownloadStatus} from "../@entry/ImgDownloadStatus.js";


/**
 * create before check exist or not.
 * @param entry
 */
export async function pmsCreateWithCheckExist(entry: ImgEntryPo): Promise<boolean> {
    const count = await pmsClient.image.count({
        where: {
            imgId: entry.id,
        }
    });

    if (count !== 0) {
        return false;
    }

    await pmsClient.image.create({
        data: {
            imgId: entry.id,
            fileType: entry.file_type,
            fileSize: entry.file_size,
            dimensionX: entry.dimension_x,
            dimensionY: entry.dimension_y,
            purity: entry.purity,
            category: entry.category,
            path: entry.path,
            url: entry.url,
            source: entry.source,
            views: entry.views,
            favorites: entry.favorites,
            ratio: entry.ratio,
            isUsed: ImgDownloadStatus.UN_DOWNLOADED,
            createdTime: new Date(entry.created_at),
        }
    });
    return true;
}


