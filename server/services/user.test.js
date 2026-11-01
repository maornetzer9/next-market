const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { generateToken, verifyToken } = require('../utils/jwt');

test('V40 login signs a bounded identity-only JWT payload', async () => {
    const source = await readFile(__filename.replace(/\.test\.js$/, '.js'), 'utf8');

    assert.match(
        source,
        /generateToken\(\{\s*user:\s*\{\s*_id:\s*user\._id\s*\}\s*\}\)/,
        'login must sign only the user id required by auth and disconnect'
    );
    assert.doesNotMatch(
        source,
        /generateToken\(\{\s*user\s*\}\)/,
        'login must not sign the persisted user document'
    );

    const token = generateToken({ user: { _id: '507f1f77bcf86cd799439011' } });
    const decoded = verifyToken(token);

    assert.ok(Buffer.byteLength(token) < 1024, 'authorization token must remain bounded');
    assert.equal(decoded.user._id, '507f1f77bcf86cd799439011');
    assert.deepEqual(Object.keys(decoded.user), ['_id']);
});

test('registration ignores client sharing preference and relies on schema default', async () => {
    const source = await readFile(__filename.replace(/\.test\.js$/, '.js'), 'utf8');

    assert.match(
        source,
        /const \{ firstName, lastName, username, password \} = req\.body;/
    );
    assert.match(source, /new User\(\{[\s\S]*firstName: normalized\.firstName,[\s\S]*password: normalized\.password/);
    assert.doesNotMatch(
        source,
        /new User\(\{ firstName, lastName, username, checked, password \}\)/
    );
    assert.match(source, /let updateFields = \{[\s\S]*checked: Boolean\(checked\)/);
    assert.match(source, /_id: \{ \$ne: req\.auth\.userId \}/);
});
