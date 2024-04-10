import os
import sys
from typing import List
from langchain.document_loaders.unstructured import UnstructuredFileLoader
import cv2
from PIL import Image
import numpy as np
import nltk
from reportlab.pdfgen import canvas
import reportlab
import PIL
#import unoconv

import os
import subprocess
from PyPDF2 import PdfMerger, PdfReader

#import sys
#sys.path.append('../configs/')
#from configs.kb_config import PDF_OCR_THRESHOLD
#from configs.kb_config import PDF_OCR_THRESHOLD
#import configs.kb_config.PDF_OCR_THRESHOLD
from ocr import get_ocr
import tqdm
import re

# PDF OCR 控制：只对宽高超过页面一定比例（图片宽/页面宽，图片高/页面高）的图片进行 OCR。
# 这样可以避免 PDF 中一些小图片的干扰，提高非扫描版 PDF 处理速度
PDF_OCR_THRESHOLD = (0.6, 0.6)
NLTK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "nltk_data")
nltk.data.path = [NLTK_DATA_PATH] + nltk.data.path

def convert(tiff, out = "out.pdf"):
    outPDF = canvas.Canvas(out, pageCompression=1)
    img = PIL.Image.open(tiff)
    for page in range(img.n_frames):
        img.seek(page)
        imgPage = reportlab.lib.utils.ImageReader(img)
        outPDF.drawImage(imgPage, 0, 0, 595, 841)
        if page < img.n_frames:
            outPDF.showPage()
    outPDF.save()
    img.close()

def convert_doc(doc, out = "out.pdf"):
    proc = subprocess.Popen(f'unoconv -f pdf "{doc}"',
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE
        )
    out, err = proc.communicate()
    print("87777777777777777777")
    print(out)
    print("000009999999")
   

class RapidOCRPDFLoader(UnstructuredFileLoader):
    def _get_elements(self) -> List:
        def rotate_img(img, angle):
            '''
            img   --image
            angle --rotation angle
            return--rotated img
            '''
            
            h, w = img.shape[:2]
            rotate_center = (w/2, h/2)
            #获取旋转矩阵
            # 参数1为旋转中心点;
            # 参数2为旋转角度,正值-逆时针旋转;负值-顺时针旋转
            # 参数3为各向同性的比例因子,1.0原图，2.0变成原来的2倍，0.5变成原来的0.5倍
            M = cv2.getRotationMatrix2D(rotate_center, angle, 1.0)
            #计算图像新边界
            new_w = int(h * np.abs(M[0, 1]) + w * np.abs(M[0, 0]))
            new_h = int(h * np.abs(M[0, 0]) + w * np.abs(M[0, 1]))
            #调整旋转矩阵以考虑平移
            M[0, 2] += (new_w - w) / 2
            M[1, 2] += (new_h - h) / 2

            rotated_img = cv2.warpAffine(img, M, (new_w, new_h))
            return rotated_img
        
        def pdf2text(filepath):
            import fitz # pyMuPDF里面的fitz包，不要与pip install fitz混淆
            import numpy as np
            ocr = get_ocr()
            doc = fitz.open(filepath)
            resp = ""

            b_unit = tqdm.tqdm(total=doc.page_count, desc="RapidOCRPDFLoader context page index: 0")
            for i, page in enumerate(doc):
                b_unit.set_description("RapidOCRPDFLoader context page index: {}".format(i))
                b_unit.refresh()
                text = page.get_text("")
                resp += text + "\n"

                img_list = page.get_image_info(xrefs=True)
                for img in img_list:
                    if xref := img.get("xref"):
                        bbox = img["bbox"]
                        # 检查图片尺寸是否超过设定的阈值
                        if ((bbox[2] - bbox[0]) / (page.rect.width) < PDF_OCR_THRESHOLD[0]
                            or (bbox[3] - bbox[1]) / (page.rect.height) < PDF_OCR_THRESHOLD[1]):
                            continue
                        pix = fitz.Pixmap(doc, xref)
                        samples = pix.samples
                        if int(page.rotation)!=0:  #如果Page有旋转角度，则旋转图片
                            img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, -1)
                            #img_array = img_array.astype(np.uint8) #zzpfox
                            #img_array = np.random.randint(0, 34, (5, 4), dtype=np.uint8)#zzpfox
                            tmp_img = Image.fromarray(img_array);
                            #tmp_img = Image.fromarray((img_array.transpose(1,2,0) * 255).astype(np.uint8))
                            # 将numpy array转成np.uint8类型
                            ori_img = cv2.cvtColor(np.array(tmp_img),cv2.COLOR_RGB2BGR)
                            rot_img = rotate_img(img=ori_img, angle=360-page.rotation)
                            img_array = cv2.cvtColor(rot_img, cv2.COLOR_RGB2BGR)
                        else:
                            img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, -1)

                        result, _ = ocr(img_array)
                        if result:
                            ocr_result = [line[1] for line in result]
                            resp += "\n".join(ocr_result)

                # 更新进度
                b_unit.update(1)
            return resp

        text = pdf2text(self.file_path)
        from unstructured.partition.text import partition_text
        return partition_text(text=text, **self.unstructured_kwargs)


 
def remove_extra_returns(text):
    # 使用正则表达式匹配两个或更多的连续回车符
    pattern1 = re.compile(r'([。？！.?!\n\r]|(\r\n))$')#(r'(^.{25,})(?<!！|”|？|。)\n\n')     /([。？！.?!\n\r]|(\r\n))$/  #(^.{25,})(?<!！|”|？|。)\r\n
    # 将匹配到的多余回车替换为一个回车符（或者完全去除，使用空字符串）
    cleaned_text1 = pattern1.sub('\n', text)  # 或者使用 '' 进行完全去除
    pattern = re.compile(r'\n\n')  
    cleaned_text = pattern.sub('',cleaned_text1)
    return cleaned_text
 
# 示例使用
#text_with_extra_returns = "这是一段文本。\r\n\r\n这是多余的回车。\r\n再来看这段文本。"
#cleaned_text = remove_extra_returns(text_with_extra_returns)
#print(cleaned_text)

if __name__ == "__main__":
    if "tif" in sys.argv[1] :#or "doc" in sys.argv[1]
        convert(sys.argv[1])
        loader = RapidOCRPDFLoader(file_path="out.pdf")
        #loader = RapidOCRPDFLoader(file_path='C:/Users/20230715/AppData/Local/Temp/GSDJNbRHfB7n.pdf')
        docs = loader.load()
        #print(docs)
        docss=remove_extra_returns(docs[0].page_content)
        print(docss)    
    if  "doc" in sys.argv[1]:
        convert_doc(sys.argv[1])
        loader = RapidOCRPDFLoader(file_path="out.pdf")
        docs = loader.load()
        docss=remove_extra_returns(docs[0].page_content)
        print(docss)
    else:
        loader = RapidOCRPDFLoader(file_path=sys.argv[1])
        #loader = RapidOCRPDFLoader(file_path='C:/Users/20230715/AppData/Local/Temp/GSDJNbRHfB7n.pdf')
        docs = loader.load()
        #print(docs)
        docss=remove_extra_returns(docs[0].page_content)
        print(docss)
        #print(docs[0].page_content)
        # assert isinstance(docs, list) and len(docs) > 0 and isinstance(docs[0].page_content, str)
        # print(str)
        #print("2222222222222222222")