<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * The gateway has no record of this reference.
 *
 * Distinct from a timeout or a gateway outage: retrying cannot change the
 * answer, so a caller that retries on this will do so forever.
 */
class PaymentNotFoundAtGateway extends RuntimeException
{
}
