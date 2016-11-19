<?php

/**
 *       __          ___      ___
 * |__| /  ` |    | |__  |\ |  |
 * |  | \__, |___ | |___ | \|  |
 *
 * @version 0.1
 * @author Claudio Santoro
 */

use Hab\Core\HabEngine;

define('ENGINE_FOLDER', __DIR__ . 'packages/');

// This Settings Are Fundamental to the Engine Work.
define('ENGINE_SETTINGS', json_encode([
    'Database' => [
        'host' => 'localhost',
        'port' => 3306,
        'user' => 'root',
        'password' => 'pass',
        'name' => 'habbo'
    ],
    'tables' => [
        'usersTable' => 'users',
        'usersColumns' => [
            'id' => 'id',
            'name' => 'username',
            'email' => 'mail',
            'look' => 'look'
        ],
        'userCriteria' => 'id',
        'userCriteriaValue' => @$_SESSION['id'],
        'tokenTable' => 'users',
        'tokenColumn' => 'auth_ticket',
        'tokenCriteria' => 'id',
        'tokenCriteriaValue' => @$_SESSION['id'],
        'onlineTable' => 'server_status',
        'onlineColumn' => 'online_users'
    ]
]));

// Be carefully to set those settings correctly. If anything be wrong, the API wouldn't work correctly
define('API_SETTINGS', json_encode([
    'hotel' => [
        'name' => 'Habbo Hotel',
        'base' => 'http://localhost/',
        'logout' => 'http://localhost/logout.php',
        'ec' => 'http://localhost/client.php'
    ],
    'emulator' => [
        'ip' => '127.0.0.1',
        'port' => 30000,
    ],
    'swf' => [
        'path' => 'http://localhost/swf/',
        'gordon' => [
            'base' => 'gordon/',
            'flash' => 'Habbo.swf'
        ],
        'gamedata' => [
            'variables' => 'gamedata/external_variables/1.txt',
            'texts' => 'gamedata/external_flash_texts/1.txt',
            'override_variables' => 'gamedata/external_override_variables/1.txt',
            'override_texts' => 'gamedata/external_override_flash_texts/1.txt',
            'furnidata' => 'gamedata/furnidata.xml',
            'productdata' => 'gamedata/productdata.xml'
        ]
    ],
    'custom' => [
        'loading' => 'Loading Habbo Hotel...',
        'logo' => 'http://localhost/images/logo.png',
    ]
]));

## Start Engine Section

@require_once "phar://HabClient.phar/bootstrap.php";

HabEngine::getInstance()->prepare(API_SETTINGS, ENGINE_SETTINGS);

echo HabEngine::getInstance()->createResponse();

## HClient ends here.