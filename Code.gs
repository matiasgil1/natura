
/**
 * NATURA GESTIÓN - API BACKEND (Vercel Ready)
 * Versión: 1.3 - Seguridad y Gastos
 */

const SPREADSHEET_ID = ""; 

function checkAndInitSheets() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = getSS();
    const existingSheetNames = ss.getSheets().map(s => s.getName());
    
    const requiredSheets = {
      'Inventario': ['ID', 'Nombre', 'Descripción', 'FotoURL', 'StockActual', 'PrecioCostoPromedio', 'PrecioVenta'],
      'Clientes': ['ID', 'Nombre', 'Apellido', 'Telefono', 'Saldo'],
      'Ventas': ['ID', 'Fecha', 'IDCliente', 'ClienteNombre', 'MontoTotal', 'MontoPagado', 'SaldoRestante', 'MetodoPago', 'GananciaNeta', 'ItemsJSON'],
      'Compras': ['ID', 'Fecha', 'IDProducto', 'Cantidad', 'PrecioCosto', 'Proveedor'],
      'Movimientos': ['ID', 'Fecha', 'IDCliente', 'ClienteNombre', 'Concepto', 'Monto', 'SaldoAnterior', 'SaldoRestante'],
      'Gastos': ['ID', 'Fecha', 'Concepto', 'Monto', 'Categoria'],
      'Usuarios': ['Usuario', 'Contraseña', 'Rol']
    };

    Object.keys(requiredSheets).forEach(name => {
      if (!existingSheetNames.includes(name)) {
        try {
          const sheet = ss.insertSheet(name);
          sheet.getRange(1, 1, 1, requiredSheets[name].length)
               .setValues([requiredSheets[name]])
               .setFontWeight('bold')
               .setBackground('#F3F4F6');
          sheet.setFrozenRows(1);
          
          // Crear usuario por defecto si es la hoja Usuarios
          if (name === 'Usuarios') {
            sheet.appendRow(['Carolina', '123', 'admin']);
          }
        } catch (e) {
          if (!e.toString().includes("Ya existe")) throw e;
        }
      }
    });
  } catch (err) {
    console.error("Error en checkAndInitSheets: " + err.toString());
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    checkAndInitSheets();
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload || {};
    let result;

    switch (action) {
      case 'login': result = login(payload.usuario, payload.password); break;
      case 'getProducts': result = getTableData('Inventario'); break;
      case 'getClients': result = getTableData('Clientes'); break;
      case 'getSales': result = getTableData('Ventas'); break;
      case 'getPurchases': result = getTableData('Compras'); break;
      case 'getMovements': result = getTableData('Movimientos'); break;
      case 'getExpenses': result = getTableData('Gastos'); break;
      case 'saveRecord': result = saveRecord(payload.sheet, payload.data); break;
      case 'updateRecord': result = updateRecord(payload.sheet, payload.id, payload.data); break;
      case 'deleteRecord': result = deleteRecord(payload.sheet, payload.id); break;
      case 'processSale': result = processSale(payload.saleData); break;
      case 'processPurchase': result = processPurchase(payload.purchaseData); break;
      case 'registerPayment': result = registerPayment(payload.clientId, payload.monto); break;
      default: 
        throw new Error("La acción '" + action + "' no está definida.");
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function login(usuario, password) {
  const users = getTableData('Usuarios');
  const user = users.find(u => u.Usuario === usuario && String(u.Contraseña) === String(password));
  if (user) {
    return { usuario: user.Usuario, rol: user.Rol };
  }
  throw new Error("Credenciales inválidas");
}

function getSS() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss && SPREADSHEET_ID) { ss = SpreadsheetApp.openById(SPREADSHEET_ID); }
  if (!ss) throw new Error("Base de datos no encontrada.");
  return ss;
}

function normalize(str) {
  return str ? str.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "") : "";
}

function getTableData(sheetName) {
  const sheet = getSS().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function saveRecord(sheetName, data) {
  const sheet = getSS().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  sheet.appendRow(row);
  return true;
}

function registerPayment(clientId, monto) {
  const ss = getSS();
  const sheetCli = ss.getSheetByName('Clientes');
  const cliData = sheetCli.getDataRange().getValues();
  const headers = cliData[0].map(normalize);
  const colId = headers.indexOf("id");
  const colSaldo = headers.indexOf("saldo");
  const colNombre = headers.indexOf("nombre");
  const colApellido = headers.indexOf("apellido");

  for (let i = 1; i < cliData.length; i++) {
    if (String(cliData[i][colId]) === String(clientId)) {
      const saldoAnterior = Number(cliData[i][colSaldo] || 0);
      const nuevoSaldo = saldoAnterior - monto;
      const clienteNombre = cliData[i][colNombre] + " " + cliData[i][colApellido];
      
      sheetCli.getRange(i + 1, colSaldo + 1).setValue(nuevoSaldo);
      
      saveRecord('Movimientos', {
        'ID': 'M' + Date.now().toString().slice(-6),
        'Fecha': new Date().toISOString(),
        'IDCliente': clientId,
        'ClienteNombre': clienteNombre,
        'Concepto': 'ABONO',
        'Monto': monto,
        'SaldoAnterior': saldoAnterior,
        'SaldoRestante': nuevoSaldo
      });
      return true;
    }
  }
  throw new Error("Cliente no encontrado.");
}

function processSale(saleData) {
  saveRecord('Ventas', {
    'ID': saleData.id,
    'Fecha': saleData.fecha,
    'IDCliente': saleData.clientId,
    'ClienteNombre': saleData.clientName,
    'MontoTotal': saleData.montoTotal,
    'MontoPagado': saleData.montoPagado,
    'SaldoRestante': saleData.saldoRestante,
    'MetodoPago': saleData.metodoPago,
    'GananciaNeta': saleData.gananciaNeta,
    'ItemsJSON': JSON.stringify(saleData.items)
  });

  const ss = getSS();
  const sheetInv = ss.getSheetByName('Inventario');
  const invData = sheetInv.getDataRange().getValues();
  const invHeaders = invData[0].map(normalize);
  const colIdInv = invHeaders.indexOf("id");
  const colStock = invHeaders.indexOf("stockactual");
  
  saleData.items.forEach(item => {
    for (let i = 1; i < invData.length; i++) {
      if (String(invData[i][colIdInv]) === String(item.productId)) {
        sheetInv.getRange(i + 1, colStock + 1).setValue(Number(invData[i][colStock]) - Number(item.cantidad));
      }
    }
  });

  if (saleData.saldoRestante > 0) {
    const sheetCli = ss.getSheetByName('Clientes');
    const cliData = sheetCli.getDataRange().getValues();
    const headers = cliData[0].map(normalize);
    const colIdCli = headers.indexOf("id");
    const colSaldo = headers.indexOf("saldo");

    for (let i = 1; i < cliData.length; i++) {
      if (String(cliData[i][colIdCli]) === String(saleData.clientId)) {
        const saldoAnterior = Number(cliData[i][colSaldo] || 0);
        const nuevoSaldo = saldoAnterior + Number(saleData.saldoRestante);
        sheetCli.getRange(i + 1, colSaldo + 1).setValue(nuevoSaldo);
        
        saveRecord('Movimientos', {
          'ID': 'V' + saleData.id.slice(-6),
          'Fecha': saleData.fecha,
          'IDCliente': saleData.clientId,
          'ClienteNombre': saleData.clientName,
          'Concepto': 'VENTA CRÉDITO',
          'Monto': saleData.saldoRestante,
          'SaldoAnterior': saldoAnterior,
          'SaldoRestante': nuevoSaldo
        });
      }
    }
  }
  return true;
}

function processPurchase(purchaseData) {
  saveRecord('Compras', {
    'ID': purchaseData.id, 'Fecha': purchaseData.fecha, 'IDProducto': purchaseData.productId,
    'Cantidad': purchaseData.cantidad, 'PrecioCosto': purchaseData.precioCosto, 'Proveedor': purchaseData.proveedor
  });
  const ss = getSS();
  const sheetInv = ss.getSheetByName('Inventario');
  const invData = sheetInv.getDataRange().getValues();
  const h = invData[0].map(normalize);
  for (let i = 1; i < invData.length; i++) {
    if (String(invData[i][h.indexOf("id")]) === String(purchaseData.productId)) {
      const s = Number(invData[i][h.indexOf("stockactual")]);
      const c = Number(invData[i][h.indexOf("preciocostopromedio")]);
      const nP = ((s * c) + (purchaseData.cantidad * purchaseData.precioCosto)) / (s + purchaseData.cantidad);
      sheetInv.getRange(i + 1, h.indexOf("stockactual") + 1).setValue(s + purchaseData.cantidad);
      sheetInv.getRange(i + 1, h.indexOf("preciocostopromedio") + 1).setValue(nP);
    }
  }
  return true;
}

function updateRecord(sheetName, id, data) {
  const sheet = getSS().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const colId = headers.map(normalize).indexOf("id");

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colId]) === String(id)) {
      Object.keys(data).forEach(key => {
        const colIdx = headers.indexOf(key);
        if (colIdx > -1) sheet.getRange(i + 1, colIdx + 1).setValue(data[key]);
      });
      return true;
    }
  }
}

function deleteRecord(sheetName, id) {
  const sheet = getSS().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const colId = values[0].map(normalize).indexOf("id");
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colId]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
}
