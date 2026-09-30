"""Safely extract an existing GitHub Pages artifact without rebuilding its files."""
import pathlib
import sys
import tarfile


def extract_pages(archive_path, destination):
    destination = pathlib.Path(destination).resolve()
    if destination.exists() and any(destination.iterdir()):
        raise ValueError('Destination must be new or empty')
    with tarfile.open(archive_path, 'r:*') as archive:
        members = archive.getmembers()
        seen = set()
        for member in members:
            path = pathlib.PurePosixPath(member.name)
            if path.is_absolute() or '..' in path.parts or '\\' in member.name:
                raise ValueError('Unsafe archive path')
            if not (member.isfile() or member.isdir()):
                raise ValueError('Archive links and special files are forbidden')
            if member.isfile() and str(path) in seen:
                raise ValueError('Duplicate archive file')
            seen.add(str(path))
        destination.mkdir(parents=True, exist_ok=True)
        archive.extractall(destination, members=members, filter='data')
    if not (destination / 'index.html').is_file():
        raise ValueError('The Pages artifact is missing its root entry')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: extract-pages.py ARCHIVE.tar DESTINATION')
    extract_pages(sys.argv[1], sys.argv[2])
