#include <assert.h>
#include "pendulab/precision.h"


real_t pendulab_force_limit(real_t force, real_t limit)
{
    assert(limit > 0);

    if (force > limit)
    {
        return limit;
    }

    if (force < -limit)
    {
        return -limit;
    }

    // force <= limit
    return force;
}