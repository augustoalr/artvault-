import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
    MockDatabase,
    ChiefAuthorizationEngine,
    SecurityAuthorizationEngine,
    MovementRequestRecord,
} from "./twoPhaseAuthRules";

describe("Two-Phase Authorization Suite: Chief & Security Domain Rules", () => {
    let db: MockDatabase;

    beforeEach(() => {
        db = new MockDatabase();

        // Seed artworks
        db.artworks.set("art-1", { id: "art-1", title: "Miranda en La Carraca", artwork_location: "Galería Central" });
        db.artworks.set("art-2", { id: "art-2", title: "Bolívar en el Chimborazo", artwork_location: "Bóveda 2" });
        db.artworks.set("art-3", { id: "art-3", title: "Naturaleza Muerta", artwork_location: "Depósito A" });
        db.artworks.set("art-unauthorized", { id: "art-unauthorized", title: "Obra Ajena", artwork_location: "Taller" });
    });

    describe("Regla 1: Rechazo si el estado de la solicitud no es 'pending_chief'", () => {
        it("debe rechazar la autorización si la solicitud está en 'pending_security'", () => {
            const req: MovementRequestRecord = {
                id: "req-already-chief",
                status: "pending_security",
                movement_type: "external",
                destination: "Museo de Bellas Artes",
                artwork_ids: ["art-1", "art-2"],
                authorized_artwork_ids: ["art-1"],
            };
            db.movementRequests.set(req.id, req);

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "Dr. Alberto Arvelo",
                chiefIdNumber: "V-11223344",
                chiefDepartment: "Conservación y Restauración",
                authorizedArtworkIds: ["art-1"],
            });

            assert.equal(result.success, false);
            assert.match(result.error ?? "", /no está pendiente de autorización por jefatura/i);
        });

        it("debe rechazar la autorización si la solicitud ya está 'authorized'", () => {
            const req: MovementRequestRecord = {
                id: "req-done",
                status: "authorized",
                movement_type: "external",
                destination: "Exposición Internacional",
                artwork_ids: ["art-1"],
                authorized_artwork_ids: ["art-1"],
            };
            db.movementRequests.set(req.id, req);

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "Dr. Alberto Arvelo",
                chiefIdNumber: "V-11223344",
                chiefDepartment: "Conservación",
                authorizedArtworkIds: ["art-1"],
            });

            assert.equal(result.success, false);
            assert.match(result.error ?? "", /no está pendiente de autorización/i);
        });

        it("debe rechazar si la solicitud está en 'rejected'", () => {
            const req: MovementRequestRecord = {
                id: "req-rejected",
                status: "rejected",
                movement_type: "external",
                destination: "Exposición",
                artwork_ids: ["art-1"],
                authorized_artwork_ids: null,
            };
            db.movementRequests.set(req.id, req);

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "Dra. Sofía Imber",
                chiefIdNumber: "V-99887766",
                chiefDepartment: "Jefatura de Colecciones",
                authorizedArtworkIds: ["art-1"],
            });

            assert.equal(result.success, false);
            assert.match(result.error ?? "", /no está pendiente de autorización/i);
        });
    });

    describe("Regla 2: Validación de authorizedArtworkIds (no vacío y perteneciente a la solicitud)", () => {
        it("debe fallar si authorizedArtworkIds viene vacío", () => {
            const req: MovementRequestRecord = {
                id: "req-empty-artworks",
                status: "pending_chief",
                movement_type: "external",
                destination: "Teatro Teresa Carreño",
                artwork_ids: ["art-1", "art-2"],
                authorized_artwork_ids: null,
            };
            db.movementRequests.set(req.id, req);

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "Lic. Manuel Cabré",
                chiefIdNumber: "V-55667788",
                chiefDepartment: "Custodia",
                authorizedArtworkIds: [],
            });

            assert.equal(result.success, false);
            assert.match(result.error ?? "", /al menos una obra/i);
        });

        it("debe fallar si authorizedArtworkIds contiene un ID que NO formaba parte de la solicitud", () => {
            const req: MovementRequestRecord = {
                id: "req-with-artworks",
                status: "pending_chief",
                movement_type: "external",
                destination: "Galería de Arte Nacional",
                artwork_ids: ["art-1", "art-2"],
                authorized_artwork_ids: null,
            };
            db.movementRequests.set(req.id, req);

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "Lic. Manuel Cabré",
                chiefIdNumber: "V-55667788",
                chiefDepartment: "Custodia",
                authorizedArtworkIds: ["art-1", "art-unauthorized"],
            });

            assert.equal(result.success, false);
            assert.match(result.error ?? "", /no forman parte de la solicitud original/i);
        });

        it("debe permitir autorización parcial siempre que las obras pertenezcan a la solicitud", () => {
            const req: MovementRequestRecord = {
                id: "req-partial-ok",
                status: "pending_chief",
                movement_type: "external",
                destination: "Galería de Arte Nacional",
                artwork_ids: ["art-1", "art-2", "art-3"],
                authorized_artwork_ids: null,
            };
            db.movementRequests.set(req.id, req);

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "Lic. Manuel Cabré",
                chiefIdNumber: "V-55667788",
                chiefDepartment: "Custodia",
                authorizedArtworkIds: ["art-1", "art-3"], // 2 de 3 autorizadas
            });

            assert.equal(result.success, true);
            const updated = db.movementRequests.get(req.id)!;
            assert.deepEqual(updated.authorized_artwork_ids, ["art-1", "art-3"]);
        });
    });

    describe("Regla 3: Snapshot de datos del Jefe persistido", () => {
        it("debe persistir fielmente el nombre, cédula, departamento, fecha de autorización y firma", () => {
            const req: MovementRequestRecord = {
                id: "req-snapshot-test",
                status: "pending_chief",
                movement_type: "external",
                destination: "Palacio Federal",
                artwork_ids: ["art-1"],
                authorized_artwork_ids: null,
            };
            db.movementRequests.set(req.id, req);

            const fakeSignaturePath = "signatures/chief_req-snapshot-test_1700000000.png";

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "  Dr. Carlos Cruz-Diez  ",
                chiefIdNumber: "  V-12345678  ",
                chiefDepartment: "  Dirección de Museología  ",
                authorizedArtworkIds: ["art-1"],
                signatureData: fakeSignaturePath,
            });

            assert.equal(result.success, true);
            const saved = db.movementRequests.get(req.id)!;

            // Verificamos trim y snapshot
            assert.equal(saved.chief_name, "Dr. Carlos Cruz-Diez");
            assert.equal(saved.chief_id_number, "V-12345678");
            assert.equal(saved.chief_department, "Dirección de Museología");
            assert.equal(saved.chief_signature_path, fakeSignaturePath);
            assert.ok(saved.chief_authorized_at, "chief_authorized_at debe estar presente");
            assert.ok(!isNaN(Date.parse(saved.chief_authorized_at!)), "Debe ser una fecha ISO válida");

            // Verificamos el log de auditoría
            const audit = db.auditLogs.find(
                (log) => log.record_id === req.id && log.action === "CHIEF_AUTHORIZED"
            );
            assert.ok(audit, "Debe registrarse el log de auditoría CHIEF_AUTHORIZED");
        });
    });

    describe("Regla 4: Transición consistente a 'pending_security'", () => {
        it("debe cambiar el estado de 'pending_chief' a 'pending_security'", () => {
            const req: MovementRequestRecord = {
                id: "req-transition-test",
                status: "pending_chief",
                movement_type: "external",
                destination: "Bienal de Venecia",
                artwork_ids: ["art-1", "art-2"],
                authorized_artwork_ids: null,
            };
            db.movementRequests.set(req.id, req);

            const result = ChiefAuthorizationEngine.authorize(db, {
                requestId: req.id,
                chiefName: "Dra. Sofía Imber",
                chiefIdNumber: "V-99887766",
                chiefDepartment: "Jefatura de Colecciones",
                authorizedArtworkIds: ["art-1", "art-2"],
            });

            assert.equal(result.success, true);
            const saved = db.movementRequests.get(req.id)!;
            assert.equal(saved.status, "pending_security");
        });
    });

    describe("Regla 5: Bloqueo de Seguridad ante obras no avaladas por el Jefe", () => {
        it("Seguridad debe bloquear la salida si el guardia intenta verificar una obra no avalada en authorized_artwork_ids", () => {
            // Caso: El movimiento pidió art-1 y art-2.
            // El Jefe SOLAMENTE avaló art-1 (art-2 fue rechazada o excluida por conservación).
            const req: MovementRequestRecord = {
                id: "req-sec-barrier",
                status: "pending_security",
                movement_type: "external",
                destination: "Embajada de Francia",
                artwork_ids: ["art-1", "art-2"],
                authorized_artwork_ids: ["art-1"], // Solo art-1 avalada
                chief_name: "Dr. Carlos Cruz-Diez",
            };
            db.movementRequests.set(req.id, req);

            // El guardia de seguridad intenta pasar art-2
            const resultSecurity = SecurityAuthorizationEngine.authorize(db, {
                requestId: req.id,
                officerName: "Oficial Pedro Pérez",
                officerId: "V-20111222",
                verifiedArtworkIds: ["art-1", "art-2"], // Intento no permitido
            });

            assert.equal(resultSecurity.success, false);
            assert.match(
                resultSecurity.error ?? "",
                /Bloqueo de seguridad: Se intentó autorizar obras no avaladas previamente por la Jefatura/i
            );

            // Verificamos que la solicitud NO cambió a 'authorized'
            assert.equal(db.movementRequests.get(req.id)!.status, "pending_security");
            // Verificamos que no se crearon movimientos físicos
            assert.equal(db.artworkMovements.length, 0);
        });

        it("Seguridad procesa exitosamente cuando se pasan solo las obras avaladas por el Jefe", () => {
            const req: MovementRequestRecord = {
                id: "req-sec-success",
                status: "pending_security",
                movement_type: "external",
                destination: "Embajada de Francia",
                artwork_ids: ["art-1", "art-2"],
                authorized_artwork_ids: ["art-1"],
                chief_name: "Dr. Carlos Cruz-Diez",
            };
            db.movementRequests.set(req.id, req);

            // El oficial de seguridad verifica únicamente art-1
            const resultSecurity = SecurityAuthorizationEngine.authorize(db, {
                requestId: req.id,
                officerName: "Oficial Pedro Pérez",
                officerId: "V-20111222",
                verifiedArtworkIds: ["art-1"],
            });

            assert.equal(resultSecurity.success, true);
            const savedReq = db.movementRequests.get(req.id)!;
            assert.equal(savedReq.status, "authorized");
            assert.equal(savedReq.security_officer_name, "Oficial Pedro Pérez");

            // Solo art-1 debe tener un movimiento registrado
            assert.equal(db.artworkMovements.length, 1);
            assert.equal(db.artworkMovements[0].artwork_id, "art-1");
            assert.equal(db.artworkMovements[0].location, "Embajada de Francia");

            // Ubicación de art-1 actualizada, art-2 se mantiene intacta
            assert.equal(db.artworks.get("art-1")!.artwork_location, "Embajada de Francia");
            assert.equal(db.artworks.get("art-2")!.artwork_location, "Bóveda 2");
        });
    });
});
