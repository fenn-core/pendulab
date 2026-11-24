cmake_minimum_required(VERSION 3.20)
project(pendulab C)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(pendulab
        src/main.c
        src/dynamics.c
        src/integrator.c)

target_include_directories(pendulab
        PRIVATE ${CMAKE_SOURCE_DIR}/src
        PRIVATE ${CMAKE_SOURCE_DIR}/include
)

target_link_libraries(pendulab PRIVATE m)

add_compile_options(
        -Wall
        -Wextra
        -Wpedantic
        -Werror=return-type
)

