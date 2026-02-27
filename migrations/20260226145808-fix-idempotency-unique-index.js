"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Удаляем старый уникальный индекс
    await queryInterface.removeIndex(
      "bonus_transactions",
      "bonus_transactions_request_id_uq",
    );

    // 2. Создаём новый составной уникальный индекс (user_id + request_id)
    await queryInterface.addIndex(
      "bonus_transactions",
      ["user_id", "request_id"],
      {
        name: "bonus_transactions_user_id_request_id_uq",
        unique: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    // удаляем новый индекс
    await queryInterface.removeIndex(
      "bonus_transactions",
      "bonus_transactions_user_id_request_id_uq",
    );

    // Восстанавливаем старый индекс
    await queryInterface.addIndex("bonus_transactions", ["request_id"], {
      name: "bonus_transactions_request_id_uq",
      unique: true,
    });
  },
};
