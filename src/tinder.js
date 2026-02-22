'use strict';

class TinderApp {
  constructor() {
    this.users = new Map();
    this.likes = new Map();
    this.matches = new Set();
  }

  addUser(user) {
    if (!user || !user.id || !user.name) {
      throw new Error('User must have an id and a name');
    }
    if (this.users.has(user.id)) {
      throw new Error(`User with id ${user.id} already exists`);
    }
    this.users.set(user.id, { id: user.id, name: user.name, age: user.age });
    this.likes.set(user.id, new Set());
    return this.users.get(user.id);
  }

  getUser(userId) {
    return this.users.get(userId) || null;
  }

  swipeRight(fromUserId, toUserId) {
    this._validateSwipe(fromUserId, toUserId);
    this.likes.get(fromUserId).add(toUserId);
    if (this.likes.get(toUserId).has(fromUserId)) {
      const matchKey = this._matchKey(fromUserId, toUserId);
      this.matches.add(matchKey);
      return { matched: true, users: [fromUserId, toUserId] };
    }
    return { matched: false };
  }

  swipeLeft(fromUserId, toUserId) {
    this._validateSwipe(fromUserId, toUserId);
    return { matched: false };
  }

  getMatches(userId) {
    if (!this.users.has(userId)) {
      throw new Error(`User ${userId} not found`);
    }
    const userMatches = [];
    for (const matchKey of this.matches) {
      const [a, b] = matchKey.split(':');
      if (a === userId || b === userId) {
        const matchedId = a === userId ? b : a;
        userMatches.push(this.users.get(matchedId));
      }
    }
    return userMatches;
  }

  isMatch(userId1, userId2) {
    return this.matches.has(this._matchKey(userId1, userId2));
  }

  _validateSwipe(fromUserId, toUserId) {
    if (!this.users.has(fromUserId)) {
      throw new Error(`User ${fromUserId} not found`);
    }
    if (!this.users.has(toUserId)) {
      throw new Error(`User ${toUserId} not found`);
    }
    if (fromUserId === toUserId) {
      throw new Error('A user cannot swipe on themselves');
    }
  }

  _matchKey(userId1, userId2) {
    return [userId1, userId2].sort().join(':');
  }
}

module.exports = TinderApp;
