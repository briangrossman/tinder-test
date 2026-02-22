'use strict';

const TinderApp = require('../src/tinder');

describe('TinderApp', () => {
  let app;
  let alice;
  let bob;
  let carol;

  beforeEach(() => {
    app = new TinderApp();
    alice = app.addUser({ id: 'u1', name: 'Alice', age: 28 });
    bob = app.addUser({ id: 'u2', name: 'Bob', age: 30 });
    carol = app.addUser({ id: 'u3', name: 'Carol', age: 25 });
  });

  describe('addUser', () => {
    it('adds a user and returns their profile', () => {
      expect(alice).toEqual({ id: 'u1', name: 'Alice', age: 28 });
    });

    it('retrieves a user by id', () => {
      expect(app.getUser('u1')).toEqual({ id: 'u1', name: 'Alice', age: 28 });
    });

    it('returns null for an unknown user id', () => {
      expect(app.getUser('unknown')).toBeNull();
    });

    it('throws when adding a user without an id', () => {
      expect(() => app.addUser({ name: 'Dave' })).toThrow('User must have an id and a name');
    });

    it('throws when adding a user without a name', () => {
      expect(() => app.addUser({ id: 'u4' })).toThrow('User must have an id and a name');
    });

    it('throws when adding a duplicate user id', () => {
      expect(() => app.addUser({ id: 'u1', name: 'Alice2' })).toThrow('User with id u1 already exists');
    });
  });

  describe('swipeRight', () => {
    it('returns matched: false when only one side has swiped right', () => {
      const result = app.swipeRight('u1', 'u2');
      expect(result).toEqual({ matched: false });
    });

    it('returns matched: true and the user ids when both sides swipe right (mutual like)', () => {
      app.swipeRight('u1', 'u2');
      const result = app.swipeRight('u2', 'u1');
      expect(result.matched).toBe(true);
      expect(result.users).toEqual(expect.arrayContaining(['u1', 'u2']));
    });

    it('throws when the source user does not exist', () => {
      expect(() => app.swipeRight('unknown', 'u2')).toThrow('User unknown not found');
    });

    it('throws when the target user does not exist', () => {
      expect(() => app.swipeRight('u1', 'unknown')).toThrow('User unknown not found');
    });

    it('throws when a user tries to swipe on themselves', () => {
      expect(() => app.swipeRight('u1', 'u1')).toThrow('A user cannot swipe on themselves');
    });
  });

  describe('swipeLeft', () => {
    it('always returns matched: false', () => {
      const result = app.swipeLeft('u1', 'u2');
      expect(result).toEqual({ matched: false });
    });

    it('does not create a match even if the other side previously swiped right', () => {
      app.swipeRight('u2', 'u1');
      app.swipeLeft('u1', 'u2');
      expect(app.isMatch('u1', 'u2')).toBe(false);
    });

    it('throws when the source user does not exist', () => {
      expect(() => app.swipeLeft('unknown', 'u2')).toThrow('User unknown not found');
    });

    it('throws when the target user does not exist', () => {
      expect(() => app.swipeLeft('u1', 'unknown')).toThrow('User unknown not found');
    });

    it('throws when a user tries to swipe on themselves', () => {
      expect(() => app.swipeLeft('u1', 'u1')).toThrow('A user cannot swipe on themselves');
    });
  });

  describe('getMatches', () => {
    it('returns an empty list when there are no matches', () => {
      expect(app.getMatches('u1')).toEqual([]);
    });

    it('returns matched users after a mutual like', () => {
      app.swipeRight('u1', 'u2');
      app.swipeRight('u2', 'u1');
      const matches = app.getMatches('u1');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual(bob);
    });

    it('returns multiple matches when a user has more than one', () => {
      app.swipeRight('u1', 'u2');
      app.swipeRight('u2', 'u1');
      app.swipeRight('u1', 'u3');
      app.swipeRight('u3', 'u1');
      const matches = app.getMatches('u1');
      expect(matches).toHaveLength(2);
      const matchedNames = matches.map((u) => u.name);
      expect(matchedNames).toEqual(expect.arrayContaining(['Bob', 'Carol']));
    });

    it('throws when the user does not exist', () => {
      expect(() => app.getMatches('unknown')).toThrow('User unknown not found');
    });
  });

  describe('isMatch', () => {
    it('returns false before any swipes', () => {
      expect(app.isMatch('u1', 'u2')).toBe(false);
    });

    it('returns true after a mutual like', () => {
      app.swipeRight('u1', 'u2');
      app.swipeRight('u2', 'u1');
      expect(app.isMatch('u1', 'u2')).toBe(true);
    });

    it('is symmetric — isMatch(a, b) === isMatch(b, a)', () => {
      app.swipeRight('u1', 'u2');
      app.swipeRight('u2', 'u1');
      expect(app.isMatch('u1', 'u2')).toBe(true);
      expect(app.isMatch('u2', 'u1')).toBe(true);
    });

    it('returns false when only one side has liked', () => {
      app.swipeRight('u1', 'u2');
      expect(app.isMatch('u1', 'u2')).toBe(false);
    });
  });
});
