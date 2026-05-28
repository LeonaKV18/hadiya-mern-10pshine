process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

const sequelize = require('../src/config/db');

require('../src/models/userModel');
require('../src/models/noteModel');
require('../src/models/folderModel');
require('../src/models/attachmentModel');

before(async function () {
  this.timeout(20000);
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

after(async () => {
  await sequelize.close();
});