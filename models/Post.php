<?php
class Post{
    protected $id;
    protected $fecha;
    protected $user;
    protected $numPosts;

    function __construct($fecha, $user, $numPosts, $id){
        $this->fecha = $fecha;
        $this->user = $user;
        $this->numPosts = $numPosts;
    }

    function getFecha(){return $this->fecha;}
    function getUser(){return $this->user;}
    function getNumPosts(){return $this->numPosts;}
    function getID(){return $this->id;}
}