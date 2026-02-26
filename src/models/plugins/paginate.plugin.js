const paginate = (schema) => {
    /**
     * @typedef {Object} QueryResult
     * @property {Document[]} results
     * @property {number} page
     * @property {number} limit
     * @property {number} totalPages
     * @property {number} totalResults
     */

    schema.statics.paginate = async function (filter = {}, options = {}) {
        let sort = 'createdAt';
        if (options.sortBy) {
            const sortingCriteria = [];
            options.sortBy.split(',').forEach((sortOption) => {
                const [key, order] = sortOption.split(':');
                sortingCriteria.push((order === 'desc' ? '-' : '') + key);
            });
            sort = sortingCriteria.join(' ');
        }

        const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;

        const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;

        const skip = (page - 1) * limit;

        const countPromise = this.countDocuments(filter).exec();

        let docsPromise = this.find(filter)
            .select(options.select)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        if (options.populate) {
            const populateOptions = Array.isArray(options.populate)
                ? options.populate
                : typeof options.populate === 'string'
                    ? options.populate.split(',')
                    : [options.populate];

            populateOptions.forEach((populateOption) => {
                if (typeof populateOption === 'string') {
                    docsPromise = docsPromise.populate(
                        populateOption
                            .split('.')
                            .reverse()
                            .reduce((a, b) => ({ path: b, populate: a }))
                    );
                } else {
                    docsPromise = docsPromise.populate(populateOption);
                }
            });
        }

        docsPromise = docsPromise.exec();

        const [totalResults, results] = await Promise.all([
            countPromise,
            docsPromise,
        ]);

        const totalPages = Math.ceil(totalResults / limit);

        return {
            results,
            page,
            limit,
            totalPages,
            totalResults,
        };
    };
};

module.exports = paginate;
