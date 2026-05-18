const { query } = require('../config/db');
const { normalizeId, toDate, toOptionalText } = require('../utils/postgres');

const buildWhereClause = (criteria = {}) => {
  const clauses = [];
  const params = [];
  let index = 1;

  for (const [key, value] of Object.entries(criteria)) {
    if (value === undefined) {
      continue;
    }

    if (key === 'resetTokenExpire' && value && typeof value === 'object' && '$gt' in value) {
      clauses.push(`reset_token_expire > $${index}`);
      params.push(toDate(value.$gt));
      index += 1;
      continue;
    }

    const columnMap = {
      id: 'id',
      username: 'username',
      email: 'email',
      resetToken: 'reset_token',
      mustChangePassword: 'must_change_password',
      role: 'role',
    };

    const column = columnMap[key];
    if (!column) {
      continue;
    }

    clauses.push(`${column} = $${index}`);
    params.push(value);
    index += 1;
  }

  return {
    clause: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};


class User {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.username = data.username ?? null;
    this.email = data.email ?? null;
    this.password = data.password ?? null;
    this.role = data.role ?? 'manager';
    this.status = data.status ?? 'pending';
    this.mustChangePassword = data.mustChangePassword ?? data.must_change_password ?? false;
    this.resetToken = data.resetToken ?? data.reset_token ?? null;
    this.resetTokenExpire = data.resetTokenExpire ?? data.reset_token_expire ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    if (!row) {
      return null;
    }
    return new User({
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role,
      status: row.status,
      mustChangePassword: row.must_change_password,
      resetToken: row.reset_token,
      resetTokenExpire: row.reset_token_expire,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
  
  static async findAll() {
    const { rows } = await query('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(User.fromRow);
  }

  async delete() {
    if (!this.id) return;
    await query('DELETE FROM users WHERE id = $1', [this.id]);
  }

  static async findOne(criteria = {}) {
    const { clause, params } = buildWhereClause(criteria);
    const { rows } = await query(`SELECT * FROM users${clause} LIMIT 1`, params);
    return User.fromRow(rows[0]);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) {
      return null;
    }

    const { rows } = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [normalizedId]);
    return User.fromRow(rows[0]);
  }

  async save() {
    const now = new Date();
    const normalizedEmail = toOptionalText(this.email);
    const normalizedResetToken = toOptionalText(this.resetToken);
    const normalizedResetTokenExpire = this.resetTokenExpire ? toDate(this.resetTokenExpire) : null;

    if (this.id) {
      const { rows } = await query(
        `
          UPDATE users
          SET username = $1,
              email = $2,
              password = $3,
              role = $4,
              status = $5,
              must_change_password = $6,
              reset_token = $7,
              reset_token_expire = $8,
              updated_at = $9
          WHERE id = $10
          RETURNING *
        `,
        [
          this.username,
          normalizedEmail,
          this.password,
          this.role,
          this.status,
          Boolean(this.mustChangePassword),
          normalizedResetToken,
          normalizedResetTokenExpire,
          now,
          this.id,
        ]
      );

      Object.assign(this, User.fromRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `
        INSERT INTO users (
          username,
          email,
          password,
          role,
          status,
          must_change_password,
          reset_token,
          reset_token_expire,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        RETURNING *
      `,
      [
        this.username,
        normalizedEmail,
        this.password,
        this.role,
        this.status,
        Boolean(this.mustChangePassword),
        normalizedResetToken,
        normalizedResetTokenExpire,
        now,
      ]
    );

    Object.assign(this, User.fromRow(rows[0]));
    return this;
  }

  toJSON() {
    return {
      _id: String(this.id),
      id: String(this.id),
      username: this.username,
      email: this.email,
      role: this.role,
      status: this.status,
      mustChangePassword: this.mustChangePassword,
      resetToken: this.resetToken,
      resetTokenExpire: this.resetTokenExpire,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;