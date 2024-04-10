from typing import TYPE_CHECKING
#import paddle



if TYPE_CHECKING:
    try:
        from rapidocr_paddle import RapidOCR
    except ImportError:
        from rapidocr_onnxruntime import RapidOCR


def get_ocr(use_cuda: bool = True) -> "RapidOCR":
    try:
        #from rapidocr_onnxruntime import RapidOCR
        #ocr = RapidOCR()
        from rapidocr_paddle import RapidOCR
        ocr = RapidOCR(det_use_cuda=use_cuda, cls_use_cuda=use_cuda, rec_use_cuda=use_cuda)
        #print(paddle.utils.run_check())
        # 如果出现PaddlePaddle is installed successfully!，说明您已成功安装。

    except ImportError:
        from rapidocr_onnxruntime import RapidOCR
        ocr = RapidOCR()
        #ocr=""
    return ocr
