import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, idFromCategorySlug } from './slug.ts';

test('slugify removes accents', () => {
  assert.equal(slugify('Café crème'), 'cafe-creme');
});

test('slugify collapses whitespace', () => {
  assert.equal(slugify('  hello   world  '), 'hello-world');
});

test('slugify strips punctuation', () => {
  assert.equal(slugify('hello, world!!!'), 'hello-world');
});

test('idFromCategorySlug extracts numeric id', () => {
  assert.equal(idFromCategorySlug('cafe-especial-7'), '7');
});

test('idFromCategorySlug returns null without suffix', () => {
  assert.equal(idFromCategorySlug('cafe-especial'), null);
});
