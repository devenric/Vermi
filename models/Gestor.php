<?php
class PostModel extends Connection {
    private $coleccion;

    function __construct() {
        parent::__construct();
        // Seleccionamos la tabla  de posts
        $this->coleccion = $this->db->posts;
    }

    // LISTAR 
    function listar() {
        // Find recibe filtros (vacío = trae todo) y opciones (ordenar por fecha)
        $cursor = $this->coleccion->find(
            [], 
            ['sort' => ['fecha_creacion' => -1]] // -1 es DESCendente (los más nuevos primero)
        );
        
        // Convertimos los resultados a un array de PHP para que tu vista pueda hacer el foreach
        return $cursor->toArray(); 
    }

    // CREAR
    function crear($image_path, $descripcion, $usuario_id) {
        //crear un array con datos
        $nuevoPost = [
            'image_path' => $image_path,
            'descripcion' => $descripcion,
            'usuario_id' => $usuario_id,
            'fecha_creacion' => new MongoDB\BSON\UTCDateTime() 
        ];

        $resultado = $this->coleccion->insertOne($nuevoPost);
        
        return $resultado->getInsertedCount() > 0;
    }
}
?>