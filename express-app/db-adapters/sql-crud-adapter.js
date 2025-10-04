function SqlCrudAdapter(queryExecutorFunction) {
  function getObjects(tableName, filter, callback) {
    filter = filter || [];
    let where = "";
    if (filter.length > 0) {
      where += " WHERE " + filter.map(fi => "" + fi.name + fi.op + fi.value).join(" AND ");
    }

    const command = "SELECT * FROM " + tableName + where;
    queryExecutorFunction(command, (error, results) => {
      if (error) {
        throw error;
      }
      callback(results.rows);
    });
  }

  function deleteObject(tableName, idValue, callback) {
    const command = "DELETE FROM " + tableName + " WHERE id='" + idValue + "'";
    queryExecutorFunction(command, (error, results) => {
      if (error) {
        throw error;
      }
      callback(results);
    });
  }

  function createObject(tableName, object, callback) {
    const valueNames = [];
    const valueIndexes = [];
    const values = [];
    Object.keys(object).forEach((key, index) => {
      // Apenas adiciona a coluna se o valor não for undefined
      if (object[key] !== undefined) {
        valueNames.push(key);
        valueIndexes.push("$" + (index + 1));
        values.push(object[key]);
      }
    });

    // **** NOVA VERIFICAÇÃO CRUCIAL ****
    // Se, após o loop, nenhuma coluna válida foi encontrada,
    // use a sintaxe DEFAULT VALUES para evitar o erro.
    if (valueNames.length === 0) {
      const command = "INSERT INTO " + tableName + " DEFAULT VALUES RETURNING id";
      queryExecutorFunction(command, [], (error, results) => { // Passa um array de valores vazio
        if (error) {
          throw error;
        }
        callback(results.rows[0].id);
      });
      return; // Encerra a função aqui para não executar o código abaixo
    }

    // Lógica original que só roda quando há colunas e valores válidos
    const command = "INSERT INTO " + tableName + " (" + valueNames.join(", ") + ") VALUES (" + valueIndexes.join(", ") + ") RETURNING id";
    queryExecutorFunction(command, values, (error, results) => {
      if (error) {
        throw error;
      }
      callback(results.rows[0].id);
    });
  }



  function updateObject(tableName, object, callback) {
    const valueNames = [];
    const values = [];
    Object.keys(object).forEach((key, index) => {
      if (object[key] !== undefined) {
        valueNames.push(key + " = $" + (index + 1));
        values.push(object[key]);
      }
    });
    const command = "UPDATE " + tableName + " SET " + valueNames.join(", ") + " WHERE id = '" + object.id + "'";
    queryExecutorFunction(command, values, (error) => {
      if (error) {
        throw error;
      }
      callback(object);
    });
  }

  return {
    create: createObject,
    retrieve: getObjects,
    update: updateObject,
    delete: deleteObject
  }
}

module.exports = SqlCrudAdapter;