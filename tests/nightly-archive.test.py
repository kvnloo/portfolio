import importlib.util
import io
import pathlib
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('extract_pages', pathlib.Path(__file__).parents[1] / 'scripts/extract-pages.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PagesArchiveTests(unittest.TestCase):
    def archive(self, root, entries):
        path = root / 'artifact.tar'
        with tarfile.open(path, 'w') as tar:
            for name, kind, content in entries:
                info = tarfile.TarInfo(name)
                info.type = kind
                if kind == tarfile.REGTYPE:
                    info.size = len(content)
                    tar.addfile(info, io.BytesIO(content))
                else:
                    info.linkname = content.decode()
                    tar.addfile(info)
        return path

    def test_preserves_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            artifact = self.archive(root, [('./index.html', tarfile.REGTYPE, b'root'), ('dev/index.html', tarfile.REGTYPE, b'dev')])
            module.extract_pages(artifact, root / 'site')
            self.assertEqual((root / 'site/dev/index.html').read_bytes(), b'dev')

    def test_rejects_unsafe_entries_before_extraction(self):
        for name, kind, content in [('../escape', tarfile.REGTYPE, b'x'), ('/absolute', tarfile.REGTYPE, b'x'), ('link', tarfile.SYMTYPE, b'../target'), ('hard', tarfile.LNKTYPE, b'index.html')]:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as tmp:
                root = pathlib.Path(tmp)
                artifact = self.archive(root, [('index.html', tarfile.REGTYPE, b'root'), (name, kind, content)])
                with self.assertRaises(ValueError):
                    module.extract_pages(artifact, root / 'site')
                self.assertFalse((root / 'site/index.html').exists())

    def test_refuses_populated_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            artifact = self.archive(root, [('index.html', tarfile.REGTYPE, b'root')])
            target = root / 'site'; target.mkdir(); (target / 'keep').write_text('keep')
            with self.assertRaises(ValueError): module.extract_pages(artifact, target)
            self.assertEqual((target / 'keep').read_text(), 'keep')


if __name__ == '__main__':
    unittest.main()
