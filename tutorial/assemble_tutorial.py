"""组合中文Markdown教程，检查本地资源，打包第三版；不生成HTML。"""
from pathlib import Path
from urllib.parse import unquote
import ast
import hashlib
import json
import os
import re
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent
COURSE = ROOT.parent
chapters = sorted((ROOT/'chapters').glob('[0-9][0-9]_*.md'))
assert len(chapters) == 19, '需要00至18共19个章节'


def relocate(match, origin):
    """合订本移动一层后，调整Markdown本地链接而不改文字或代码。"""
    label, target = match.group(1), match.group(2)
    if target.startswith(('https:', 'http:', 'mailto:', '#')):
        return match.group(0)
    path, separator, fragment = target.partition('#')
    resolved = (origin.parent/unquote(path)).resolve()
    relative = Path(os.path.relpath(resolved, ROOT)).as_posix()
    return f'[{label}]({relative}{separator}{fragment})'


def main():
    header = '# 音频算法新手教程：从声音、代码到实习项目\n\n'
    header += '第三版 · 2026-10-22 · 全中文教学 · 核心代码带注释 · 附实际运行图\n\n'
    header += '使用方式与分章导航见 [教程目录](README.md)。4份逐格练习本已执行并保存输出；各章短代码的实际运行状态见核验记录。\n\n'
    header += '本合订本是系统入门教程，不声称穷尽所有音频研究。教学信号、模块验证与真实业务项目严格分开。\n\n'
    combined = [header]
    for chapter in chapters:
        text = chapter.read_text(encoding='utf-8')
        combined.append(re.sub(r'\[([^\]]*)\]\(([^)]+)\)', lambda m: relocate(m,chapter), text))
    book = ROOT/'音频算法新手教程_合订本.md'
    book.write_text('\n\n---\n\n'.join(combined), encoding='utf-8')

    results = {}
    for name in ['foundation_snippets.json', 'frontend_snippets.json', 'speech_snippets.json']:
        path = ROOT/'results'/name
        assert path.exists(), f'缺少章节代码核验：{name}'
        results[name] = json.loads(path.read_text(encoding='utf-8'))
    foundation = results['foundation_snippets.json']
    frontend = results['frontend_snippets.json']
    speech = results['speech_snippets.json']
    assert foundation['passed'] and frontend['status']=='passed' and speech['status']=='passed'
    verified = []
    for chapter in foundation['chapters']:
        source = COURSE / chapter['file']
        assert hashlib.sha256(source.read_bytes()).hexdigest() == chapter['sha256']
        for snippet in chapter['snippets']:
            assert snippet['status']=='passed'
            verified.append({'file':source.name,'block':snippet['index'],'stdout':snippet['stdout']})
    for record in frontend['records'] + speech['tests']:
        assert record['exit_code']==0
        output = record['stdout']
        if isinstance(output,list): output = '\n'.join(output)+'\n'
        verified.append({'file':Path(record['file']).name,'block':record['block'],'stdout':output})
    snippet_total = 0
    for chapter in chapters:
        snippets = re.findall(r'```python\s*\n(.*?)```', chapter.read_text(encoding='utf-8'), re.S)
        for index, snippet in enumerate(snippets, 1):
            ast.parse(snippet, filename=f'{chapter.name}:{index}')
        snippet_total += len(snippets)
    assert len(verified)==snippet_total==34
    summary = ['# 章节代码的实际运行输出\n\n所有34个Python代码块已运行通过。第01—06课按章保留上下文；第07—16课的代码块分别独立运行。运行图直接放在对应章节代码后。这里记录数字输出，不把教学数据当成真实业务效果。']
    for record in verified:
        summary.append(f'## [{record["file"]}](../chapters/{record["file"]}) · 代码块 {record["block"]}\n\n```text\n{record["stdout"]}```')
    (ROOT/'results'/'章节代码实测输出.md').write_text('\n\n'.join(summary)+'\n',encoding='utf-8')
    sources = [*sorted((COURSE/'code').glob('*.py')), *sorted((ROOT/'code').glob('*.py')),
               *sorted(ROOT.glob('*.py'))]
    for source in sources:
        ast.parse(source.read_text(encoding='utf-8'))

    # 先写报告占位，目录中的核验链接即可被同一轮检查。
    report_path = ROOT/'results'/'tutorial_verification.json'
    report_path.write_text('{}', encoding='utf-8')
    broken = []
    checked = 0
    for page in [ROOT/'README.md', book, *chapters, *sorted(ROOT.glob('0[1-4]_*.md'))]:
        text = page.read_text(encoding='utf-8')
        assert '\ufffd' not in text, f'编码替换符：{page}'
        for target in re.findall(r'\]\(([^)]+)\)', text):
            if target.startswith(('https:', 'http:', 'mailto:', '#')):
                continue
            checked += 1
            local = unquote(target.split('#')[0])
            if not (page.parent/local).exists():
                broken.append([str(page.relative_to(ROOT)), local])
    assert not broken, broken

    notebooks = []
    for path in sorted(ROOT.glob('*.ipynb')):
        document = json.loads(path.read_text(encoding='utf-8'))
        code_cells = [c for c in document['cells'] if c['cell_type']=='code']
        assert all(c['execution_count'] and not any(o['output_type']=='error' for o in c['outputs']) for c in code_cells)
        notebooks.append({'文件': path.name, '已执行代码单元': len(code_cells),
                          '图输出': sum('image/png' in o.get('data',{}) for c in code_cells for o in c['outputs'])})
    report = {'日期':'2026-10-22', '正文章数':len(chapters),
              '正文字符数_含代码':sum(len(p.read_text(encoding='utf-8')) for p in chapters),
              '正文汉字数':sum(len(re.findall(r'[\u4e00-\u9fff]',p.read_text(encoding='utf-8'))) for p in chapters),
              '新增PNG数量':len(list((ROOT/'figures').glob('*.png'))),
              '已执行并通过的章节Python代码块数':len(verified),
              'Python语法通过文件数':len(sources), '本地资源引用检查数':checked,
              '失效本地链接':broken, '已执行练习本':notebooks,
              '章节核验记录文件':list(results),
              '视觉检查':'16张章节对应图已由负责章节的代理逐张检查；主代理另抽检7张新增图，中文及图例可读',
              '未完成事项':'MATLAB函数未运行；本课未训练真实语音ASR/TTS系统；不包含新招聘名额核验'}
    report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))

    target = COURSE.parent/'audio-course-zh-beginner-v3-20261022.zip'
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(COURSE.rglob('*')):
            relative = path.relative_to(COURSE)
            if path.is_file() and not any(part in {'.am-cache','__pycache__'} for part in relative.parts):
                archive.write(path, Path(COURSE.name)/relative)
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        print(f'压缩包校验通过：{target}；{len(archive.namelist())}个文件；{target.stat().st_size}字节')


if __name__=='__main__':
    main()
