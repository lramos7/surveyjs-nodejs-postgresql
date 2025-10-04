function SqlCrudAdapter(queryExecutorFunction) {
  async function getObjects(tableName, filter, callback) {
    filter = filter || [];
    let where = "";
    if (filter.length > 0) {
      where += " WHERE " + filter.map(fi => "" + fi.name + fi.op + fi.value).join(" AND ");
    }
    const command = "SELECT * FROM " + tableName + where;
    try {
      const results = await queryExecutorFunction(command);
      callback(results.rows);
    } catch (error) {
      throw error;
    }
  }

  async function deleteObject(tableName, idValue, callback) {
    const command = "DELETE FROM " + tableName + " WHERE id='" + idValue + "'";
    try {
      const results = await queryExecutorFunction(command);
      callback(results);
    } catch (error) {
      throw error;
    }
  }

  async function createObject(tableName, object, callback) {
    const valueNames = [];
    const valueIndexes = [];
    const values = [];
    Object.keys(object).forEach((key, index) => {
      if (object[key] !== undefined) {
        valueNames.push(key);
        valueIndexes.push("$" + (index + 1));
        values.push(object[key]);
      }
    });

    if (valueNames.length === 0) {
        const command = "INSERT INTO " + tableName + " DEFAULT VALUES RETURNING id";
        try {
            const results = await queryExecutorFunction(command, []);
            callback(results.rows[0].id);
        } catch (error) {
            throw error;
        }
        return;
    }

    const command = "INSERT INTO " + tableName + " (" + valueNames.join(", ") + ") VALUES (" + valueIndexes.join(", ") + ") RETURNING id";
    try {
        const results = await queryExecutorFunction(command, values);
        callback(results.rows[0].id);
    } catch (error) {
        throw error;
    }
  }

  async function updateObject(tableName, object, callback) {
    const valueNames = [];
    const values = [];
    Object.keys(object).forEach((key, index) => {
      if (object[key] !== undefined) {
        valueNames.push(key + " = $" + (index + 1));
        values.push(object[key]);
      }
    });
    const command = "UPDATE " + tableName + " SET " + valueNames.join(", ") + " WHERE id = '" + object.id + "'";
    try {
      await queryExecutorFunction(command, values);
      callback(object);
    } catch (error) {
      throw error;
    }
  }

  return {
    create: createObject,
    retrieve: getObjects,
    update: updateObject,
    delete: deleteObject,
    query: queryExecutorFunction // Exporta a função de query para uso direto
  }
}

module.exports = SqlCrudAdapter;