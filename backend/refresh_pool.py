"""Refresh public artwork material; credentials only enter through the environment."""
import datetime as dt
import hashlib
import html.parser
import json
import os
from pathlib import Path
import re
import secrets
import ssl
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
FOLDER = '141UI3Jy4s4ppzFwWdIO00CdjRM9p6iXi'
MODEL = os.environ.get('OPENAI_MODEL', 'gpt-5.4-mini')
PROMPT_VERSION = 'truth-aphorisms-2026-10-20-v1'
INSTRUCTIONS = '''Write original English aphoristic statements for an experimental art publication called Something Must Be True. The subject is how authority, belief, memory, interfaces, institutions and images manufacture credibility. Write 24 distinct, sharp, strange sentences. Each should fit on a poster: usually 5 to 14 words, at most 150 characters. Use concrete objects, uncomfortable observations, ambiguity and occasional dry humour. Vary syntax and attitude. Avoid marketing, motivational advice, generic technology commentary, em dashes, antithesis, "not X but Y", endless "X is Y" definitions, and repeated sentence openings. Do not quote or imitate specific living artists, including Jenny Holzer. Do not copy familiar slogans. Do not claim verified research, invent citations, accuse real people, or offer medical/legal/financial advice. These are speculative authored utterances, not factual findings. Return uppercase sentences, with punctuation, in the requested JSON object.'''
MOTIFS = ['a receipt, a border, a queue', 'a witness, a broken clock, a waiting room', 'an ear, a rumour, an office chair', 'a hand, a daisy, a signature', 'an archive, a landlord, an empty shelf', 'a caption, a bruise, a mirror', 'a podium, a uniform, an unclaimed coat', 'a vote, a family photograph, a stamp', 'a spreadsheet, an oyster, a key', 'a lift, a verdict, a curtain', 'a translation, a stain, a missing guest', 'an apology, a gate, a loudspeaker']
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))


def request(url, *, data=None, headers=None, cap=8_000_000):
    req = urllib.request.Request(url, data=data, headers={'User-Agent': 'TruthMachineMaterialPool/1.0', **(headers or {})})
    with urllib.request.urlopen(req, timeout=75, context=CTX) as r:
        body = r.read(cap + 1)
        if len(body) > cap:
            raise ValueError('response_too_large')
        return body, r.headers.get('Content-Type', '')


def atomic_json(path, data):
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def safe_error(e):
    if isinstance(e, urllib.error.HTTPError):
        if not hasattr(e, '_truth_code'):
            try:
                code = json.loads(e.read(20000)).get('error', {}).get('code', '')
                code = code if isinstance(code, str) and re.fullmatch(r'[a-zA-Z0-9_-]{1,80}', code) else ''
            except Exception:
                code = ''
            e._truth_code = 'http_' + str(e.code) + ('_' + code if code else '')
        return e._truth_code
    if isinstance(e, urllib.error.URLError):
        return 'connection_error'
    return type(e).__name__


class FolderParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.current = None
        self.title_depth = None
        self.items = []
        self.seen_entries = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'div':
            self.depth += 1
            classes = a.get('class', '').split()
            if 'flip-entry' in classes:
                self.seen_entries += 1
                self.current = {'depth': self.depth, 'title': '', 'id': ''}
            if self.current and 'flip-entry-title' in classes:
                self.title_depth = self.depth
        if tag == 'a' and self.current:
            m = re.match(r'https://drive\.google\.com/file/d/([A-Za-z0-9_-]{10,100})/', a.get('href', ''))
            if m:
                self.current['id'] = m[1]

    def handle_data(self, text):
        if self.current and self.title_depth:
            self.current['title'] += text

    def handle_endtag(self, tag):
        if tag != 'div':
            return
        if self.title_depth == self.depth:
            self.title_depth = None
        if self.current and self.depth == self.current['depth']:
            if self.current['id'] and re.search(r'\.(png|jpe?g|webp|gif|avif)$', self.current['title'], re.I):
                self.items.append(self.current)
            self.current = None
        self.depth -= 1


def refresh_drive(previous, now):
    raw, _ = request('https://drive.google.com/embeddedfolderview?id=' + FOLDER, cap=2_000_000)
    markup = raw.decode('utf-8')
    if 'flip-contents' not in markup or 'flip-entries' not in markup:
        raise ValueError('folder_listing_unavailable')
    parser = FolderParser()
    parser.feed(markup)
    # Preserve only the approved folder's images; no recursive traversal.
    items = parser.items
    if len(items) > 60:
        items = secrets.SystemRandom().sample(items, 60)
    directory = ROOT / 'drive-images'
    directory.mkdir(exist_ok=True)
    result = []
    for entry in items:
        try:
            body, mime = request('https://drive.google.com/thumbnail?id=' + entry['id'] + '&sz=w1600')
            if body.startswith(b'\xff\xd8\xff'):
                ext = 'jpg'
            elif body.startswith(b'\x89PNG\r\n\x1a\n'):
                ext = 'png'
            elif body.startswith((b'GIF87a', b'GIF89a')):
                ext = 'gif'
            elif body.startswith(b'RIFF') and body[8:12] == b'WEBP':
                ext = 'webp'
            elif body[4:12] in (b'ftypavif', b'ftypavis'):
                ext = 'avif'
            else:
                raise ValueError('unsupported_image')
            name = entry['id'] + '.' + ext
            (directory / name).write_bytes(body)
            result.append({'id': entry['id'], 'title': entry['title'][:240], 'url': 'drive-images/' + name, 'source': 'https://drive.google.com/file/d/' + entry['id'] + '/view', 'origin': 'Google Drive / ' + entry['title'][:240]})
        except Exception as e:
            print('::warning::Drive image skipped: ' + safe_error(e))
    if items and not result:
        raise ValueError('no_images_downloaded')
    keep = {x['url'].split('/')[-1] for x in result}
    for path in directory.iterdir():
        if path.is_file() and path.name not in keep:
            path.unlink()
    return result, now


def refresh_ai(previous, now):
    key = os.environ.get('OPENAI_API_KEY', '')
    if not key:
        raise ValueError('missing_api_key')
    schema = {'type': 'object', 'properties': {'sentences': {'type': 'array', 'minItems': 24, 'maxItems': 24, 'items': {'type': 'string'}}}, 'required': ['sentences'], 'additionalProperties': False}
    motif = secrets.choice(MOTIFS)
    avoid = [x['text'] for x in previous[-20:] if isinstance(x, dict) and isinstance(x.get('text'), str)]
    prompt = 'Motifs for this draw: ' + motif + '. Invent surprising relationships. Do not repeat these recent lines: ' + json.dumps(avoid)
    body = json.dumps({'model': MODEL, 'store': False, 'instructions': INSTRUCTIONS, 'input': prompt, 'reasoning': {'effort': 'low'}, 'max_output_tokens': 3500, 'text': {'format': {'type': 'json_schema', 'name': 'truisms', 'strict': True, 'schema': schema}}}).encode()
    raw, _ = request('https://api.openai.com/v1/responses', data=body, headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}, cap=2_000_000)
    response = json.loads(raw)
    if response.get('status') != 'completed':
        raise ValueError('model_response_incomplete')
    text = ''.join(c.get('text', '') for out in response.get('output', []) if out.get('type') == 'message' for c in out.get('content', []) if c.get('type') == 'output_text')
    candidates = json.loads(text)['sentences']
    if len(candidates) != 24:
        raise ValueError('wrong_sentence_count')
    known = {x['text'].casefold() for x in previous if isinstance(x, dict) and isinstance(x.get('text'), str)}
    fresh = []
    for line in candidates:
        if not isinstance(line, str):
            continue
        line = re.sub(r'\s+', ' ', line).strip().upper()
        if not (10 <= len(line) <= 150) or line.casefold() in known:
            continue
        known.add(line.casefold())
        fresh.append({'id': hashlib.sha256(line.encode()).hexdigest()[:16], 'text': line, 'origin': 'OpenAI / ' + response.get('model', MODEL) + ' / ' + now, 'model': response.get('model', MODEL), 'generatedAt': now, 'promptVersion': PROMPT_VERSION, 'motifs': motif})
    if len(fresh) < 12:
        raise ValueError('insufficient_new_sentences')
    print('New AI sentences:', len(fresh))
    return (previous + fresh)[-600:], now


def main():
    path = ROOT / 'live-pool.json'
    previous = json.loads(path.read_text()) if path.exists() else {}
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    data = {**previous, 'version': 1, 'checkedAt': now, 'driveFolder': 'https://drive.google.com/drive/folders/' + FOLDER, 'refreshCadence': 'hourly', 'promptVersion': PROMPT_VERSION, 'prompt': INSTRUCTIONS, 'errors': {}}
    try:
        data['images'], data['imagesUpdatedAt'] = refresh_drive(previous.get('images', []), now)
        print('Public Drive images:', len(data['images']))
    except Exception as e:
        data['images'] = previous.get('images', [])
        data['errors']['drive'] = safe_error(e)
        print('::warning::Drive refresh failed: ' + safe_error(e))
    if '--images-only' not in sys.argv:
        try:
            data['truisms'], data['truismsUpdatedAt'] = refresh_ai(previous.get('truisms', []), now)
        except Exception as e:
            data['truisms'] = previous.get('truisms', [])
            data['errors']['ai'] = safe_error(e)
            print('::warning::AI refresh failed: ' + safe_error(e))
    else:
        data['truisms'] = previous.get('truisms', [])
    atomic_json(path, data)
    print('Public material pool written. No credentials included.')


if __name__ == '__main__':
    main()
