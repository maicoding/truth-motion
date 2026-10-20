import importlib.util
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('refresh_pool', Path(__file__).with_name('refresh_pool.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class MaterialTests(unittest.TestCase):
    def test_only_images_in_direct_public_folder(self):
        p = module.FolderParser()
        p.feed('<div class="flip-entries"><div class="flip-entry"><a href="https://drive.google.com/file/d/abcdefghijk123/view"><div class="flip-entry-title">My image.png</div></a></div><div class="flip-entry"><a href="https://drive.google.com/file/d/somefile99999/view"><div class="flip-entry-title">private.txt</div></a></div><div class="flip-entry"><a href="https://drive.google.com/drive/folders/subfolder999"><div class="flip-entry-title">Subfolder.png</div></a></div></div>')
        self.assertEqual([(x['id'], x['title']) for x in p.items], [('abcdefghijk123', 'My image.png')])

    def test_complete_api_response_gets_provenance(self):
        lines = ['A RECEIPT REMEMBERS ROOM NUMBER ' + str(i) + '.' for i in range(24)]
        data = {'status': 'completed', 'model': 'test-model', 'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': json.dumps({'sentences': lines})}]}]}
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-only'}), patch.object(module, 'request', return_value=(json.dumps(data).encode(), 'application/json')) as call:
            result, when = module.refresh_ai([], '2026-10-20T12:00:00+00:00')
        self.assertEqual(len(result), 24)
        self.assertEqual(result[0]['model'], 'test-model')
        self.assertEqual(result[0]['generatedAt'], when)
        self.assertEqual(result[0]['promptVersion'], module.PROMPT_VERSION)
        request_data = json.loads(call.call_args.kwargs['data'])
        self.assertFalse(request_data['store'])
        self.assertEqual(request_data['max_output_tokens'], 3500)

    def test_refusal_or_incomplete_is_not_published_as_text(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-only'}), patch.object(module, 'request', return_value=(b'{"status":"incomplete"}', 'application/json')):
            with self.assertRaises(ValueError):
                module.refresh_ai([], '2026-10-20T12:00:00+00:00')

if __name__ == '__main__':
    unittest.main()
