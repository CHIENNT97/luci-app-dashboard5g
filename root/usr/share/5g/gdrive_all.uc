'use strict';
import { readfile } from 'fs';

let raw = readfile('/tmp/gdrive.html');
if (!raw) {
	print("File not found\n");
	exit(0);
}

// Tìm toàn bộ các file trong Google Drive folder
// Pattern 1: data-handled-by-drag-and-drop="true" ssk='5:auSv138:<FILE_ID>-0-16'
// Pattern 2: [..., "<FILE_ID>", ...]
let lines = split(raw, 'data-handled-by-drag-and-drop="true"');
print("Found " + (length(lines) - 1) + " items in Google Drive folder\n");

for (let i = 1; i < length(lines); i++) {
	let itemChunk = lines[i];
	let mId = match(itemChunk, /ssk=['"]5:[^:]*:([a-zA-Z0-9_-]{25,})/);
	let fileId = mId ? mId[1] : '';

	// Tìm tên file
	let prevChunk = lines[i-1];
	let mName = match(prevChunk, /aria-label=['"]([^'"]+)['"]/);
	if (!mName) mName = match(itemChunk, /aria-label=['"]([^'"]+)['"]/);
	if (!mName) mName = match(prevChunk, />([^<]+\.(bin|img|tar\.gz|trx|iso))</i);

	print("Item #" + i + " -> ID: " + fileId + " | Name: " + (mName ? mName[1] : 'unknown') + "\n");
}
