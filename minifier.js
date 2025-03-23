document.addEventListener('DOMContentLoaded', () => {
    const htmlFileInput = document.getElementById('html-file');
    const cssFileInput = document.getElementById('css-file');
    const jsFileInput = document.getElementById('js-file');
    const processBtn = document.getElementById('process-btn');
    const resultSection = document.getElementById('result-section');
    const resultCode = document.getElementById('result-code');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    const htmlFileInfo = document.getElementById('html-file-info');
    const cssFileInfo = document.getElementById('css-file-info');
    const jsFileInfo = document.getElementById('js-file-info');
    
    const originalSizeElement = document.getElementById('original-size');
    const minifiedSizeElement = document.getElementById('minified-size');
    const reductionElement = document.getElementById('size-reduction');
    
    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';
    let minifiedResult = '';
    
    let originalSizes = {
        html: 0,
        css: 0,
        js: 0
    };
    
    htmlFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            htmlFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            originalSizes.html = file.size;
            readFile(file, 'html');
        } else {
            htmlFileInfo.textContent = 'No file selected';
            htmlContent = '';
            originalSizes.html = 0;
        }
    });
    
    cssFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            cssFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            originalSizes.css = file.size;
            readFile(file, 'css');
        } else {
            cssFileInfo.textContent = 'No file selected';
            cssContent = '';
            originalSizes.css = 0;
        }
    });
    
    jsFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            jsFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            originalSizes.js = file.size;
            readFile(file, 'js');
        } else {
            jsFileInfo.textContent = 'No file selected';
            jsContent = '';
            originalSizes.js = 0;
        }
    });
    
    processBtn.addEventListener('click', () => {
        if (!htmlContent) {
            alert('Please upload an HTML file.');
            return;
        }
        
        minifiedResult = processFiles();
        resultCode.textContent = minifiedResult;
        resultSection.classList.remove('hidden');
        
        updateSizeStatistics();
        
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(minifiedResult)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                alert('Copy failed. Try again.');
            });
    });
    
    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([minifiedResult], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'minified.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    function readFile(file, type) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            switch(type) {
                case 'html':
                    htmlContent = content;
                    break;
                case 'css':
                    cssContent = content;
                    break;
                case 'js':
                    jsContent = content;
                    break;
            }
        };
        reader.readAsText(file);
    }
    
    function processFiles() {
        const minifiedCss = cssContent ? minifyCss(cssContent) : '';
        const safeJs = jsContent ? safeJsMinify(jsContent) : '';
        return combineFiles(htmlContent, minifiedCss, safeJs);
    }
    
    function minifyCss(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*({|}|;|:|,)\s*/g, '$1')
            .replace(/;}|{\s*}/g, '}')
            .trim();
    }
    
    function safeJsMinify(js) {
        return js
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();
    }
    
    function combineFiles(html, css, js) {
        try {
            const doctype = html.match(/<!DOCTYPE[^>]*>/i);
            const doctypeStr = doctype ? doctype[0] : '';
            const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
            let headContent = headMatch ? headMatch[1] : '';
            const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
            let bodyContent = bodyMatch ? bodyMatch[1] : '';
            headContent = headContent.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
            bodyContent = bodyContent.replace(/<script[^>]*src="[^"]*"[^>]*>[\s\S]*?<\/script>/gi, '');
            let result = doctypeStr + '\n<html>';
            result += '\n<head>' + headContent;
            if (css) {
                result += '\n<style>' + css + '</style>';
            }
            result += '\n</head>';
            result += '\n<body>' + bodyContent;
            if (js) {
                result += '\n<script>\n' + js + '\n</script>';
            }
            result += '\n</body>\n</html>';
            return result
                .replace(/>\s+</g, '><')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/(\s{2,})/g, ' ')
                .trim();
                
        } catch (error) {
            alert('Error. Check files and try again.');
            return html;
        }
    }
    
    function updateSizeStatistics() {
        const totalOriginalSize = originalSizes.html + originalSizes.css + originalSizes.js;
        const minifiedSize = new TextEncoder().encode(minifiedResult).length;
        let reductionPercentage = 0;
        if (totalOriginalSize > 0) {
            reductionPercentage = ((totalOriginalSize - minifiedSize) / totalOriginalSize) * 100;
        }
        originalSizeElement.textContent = formatFileSize(totalOriginalSize);
        minifiedSizeElement.textContent = formatFileSize(minifiedSize);
        const formattedReduction = reductionPercentage.toFixed(1) + '%';
        reductionElement.textContent = formattedReduction;
        reductionElement.className = 'value reduction';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 