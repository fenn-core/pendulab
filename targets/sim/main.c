
#include <stddef.h>
#include <stdio.h>
#include "pendulab/controller.h"
#include "pendulab/dynamics.h"
#include "pendulab/integrator.h"
#include "pendulab/actuator.h"


void pendulab_print(FILE *file_ptr, state_t *state, parameters_t *params, real_t time,
                    real_t F, real_t F_cmd)
{
    real_t energy = pendulab_energy(state, params);
    real_t momentum = pendulab_momentum(state, params);

    fprintf(file_ptr,
            "%" PRIreal ","
            "%" PRIreal ","
            "%" PRIreal ","
            "%" PRIreal ","
            "%" PRIreal ","
            "%" PRIreal ","
            "%" PRIreal ","
            "%" PRIreal ","
            "%" PRIreal "\n",
            time, state->x, state->theta, state->v, state->omega,
            F, F_cmd, energy, momentum);
}


int pendulab_test_pendulum(void)
{
    state_t state = {.x = 0, .theta = 0.05, .v = 0, .omega = 0};
    parameters_t params = {.M = 0.5, .m = 0.1, .l = 0.3, .g = 9.81};
    real_t F = 0.0;

    FILE *file_ptr = fopen("../results/pendulum_test.csv", "w");

    if (file_ptr == NULL)
    {
        return 1;
    }

    fprintf(file_ptr, "t,x,theta,v,omega,F,F_cmd,E,px\n");

    real_t duration = 10.0;
    real_t dt = 0.001;
    real_t time = 0.0;
    size_t steps = (size_t)(duration / dt);

    for (size_t i = 0; i < steps; ++i)
    {
        pendulab_print(file_ptr, &state, &params, time, F, F);
        state = pendulab_rk4(&state, &params, F, dt);
        time += dt;
    }

    pendulab_print(file_ptr, &state, &params, time, F, F);

    fclose(file_ptr);

    return 0;
}


int pendulab_test_lqr(void)
{
    state_t state = {.x = 0, .theta = 0.1, .v = 0, .omega = 0};
    parameters_t params = {.M = 0.5, .m = 0.1, .l = 0.3, .g = 9.81};

    real_t F = 0.0;
    real_t F_cmd = 0.0;
    const real_t force_limit = REAL(10.0);

    lqr_gains_t gains = {
#include "lqr_gains.inc"

    };


    FILE *file_ptr = fopen("../results/lqr_test.csv", "w");

    if (file_ptr == NULL)
    {
        return 1;
    }

    fprintf(file_ptr, "t,x,theta,v,omega,F,F_cmd,E,px\n");

    real_t duration = 10.0;
    real_t dt = 0.001;
    real_t time = 0.0;
    size_t steps = (size_t)(duration / dt);

    for (size_t i = 0; i < steps; ++i)
    {
        F_cmd = pendulab_lqr(&state, &gains);
        F = pendulab_force_limit(F_cmd, force_limit);

        pendulab_print(file_ptr, &state, &params, time, F, F_cmd);

        state = pendulab_rk4(&state, &params, F, dt);
        time += dt;
    }

    F_cmd = pendulab_lqr(&state, &gains);
    F = pendulab_force_limit(F_cmd, force_limit);

    pendulab_print(file_ptr, &state, &params, time, F, F_cmd);

    fclose(file_ptr);

    return 0;
}


int main(void)
{
    int program_state = 0;

    program_state = pendulab_test_pendulum();

    if (program_state)
    {
        return program_state;
    }

    program_state = pendulab_test_lqr();

    return program_state;
}
