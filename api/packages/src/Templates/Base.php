<?php

namespace Hab\Templates;

use Hab\Core\HabMessage;

/**
 * Class Base
 * @package Hab\Templates
 *
 * @version 0.1
 * @author Claudio Santoro
 */
abstract class Base
{
    /**
     * Response from Template
     *
     * @var string
     */
    private $response = '';

    /**
     * Creates a new Instance of a Template
     */
    public abstract function __construct();

    /**
     * Not Found Message
     *
     * @return string
     */
    public function NotFound()
    {
        return (new HabMessage(404, "The Requested Uri wasn't found in this HabClient."))->renderJson();
    }

    /**
     * Get Response
     *
     * @return string
     */
    public function getResponse()
    {
        return $this->response;
    }
}