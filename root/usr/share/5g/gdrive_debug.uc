'use strict';
import { readfile } from 'fs';

let raw = readfile('/tmp/gdrive.html');
if (!raw) {
	print("File not found or empty\n");
	exit(0);
}

// Tìm các file .bin và ID xung quanh
let parts = split(raw, 'chiennt97');
print("Found " + length(parts) + " occurrences of chiennt97\n");

for (let i = 1; i < length(parts); i++) {
	let chunk = substr(parts[i], 0, 300);
	print("--- Occurrence " + i + " ---\n" + chunk + "\n\n");
}
